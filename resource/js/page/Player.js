import { Dynamic } from "../init/module.js";
import { pushProgressSnackbar, pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

// ==========================================
// 1. 초기 설정 및 전역 상태 관리
// ==========================================

/**
 * @description YouTube 플레이어 및 재생목록 데이터의 전반적인 상태를 관리하는 전역 설정 객체입니다.
 * 재생할 영상들의 목록과 현재 재생 중인 위치 정보를 기억하여 로컬 스토리지 동기화 및 UI 업데이트에 활용됩니다.
 * @property {Array<object>} entries - 현재 재생 대기열에 포함된 모든 영상 정보(ID 썸네일 제목) 배열
 * @property {number} lastIdx - 내부 큐에서 마지막으로 재생된 영상의 위치 인덱스 번호
 * @property {object|null} currentEntry - 현재 재생 중인 단일 영상의 정보 객체
 */
let YConfig = {
    entries: [{
        id: "C0DPdy98e4c",
        img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
        title: "TEST VIDEO"
    }],
    lastIdx: -1,
    currentEntry: null
};

// ==========================================
// 2. 서비스 클래스 정의 (API 통신 및 UI/플레이어 제어)
// ==========================================

/**
 * @class YouTubeAPIService
 * @description YouTube IFrame API와 YouTube oEmbed 엔드포인트만 사용하여 재생 가능한 영상 ID 및 공개 메타데이터를 가져오는 통신 담당 클래스입니다.
 * YouTube Data API v3는 클라이언트 API Key, HTTP referrer 판정, 모바일 브라우저/PWA 환경 차이에 영향을 받을 수 있으므로 이 구현에서는 사용하지 않습니다.
 * 재생목록의 전체 영상 ID는 숨김 IFrame 플레이어의 playlist queue를 통해 확보하고, 제목/썸네일은 oEmbed를 낮은 동시성으로 지연 보강합니다.
 */
class YouTubeAPIService {
    // --- Public Methods ---
    /**
     * @description 마지막 로드 실패 원인을 UI 레이어에서 사용자에게 보여주기 위한 읽기 전용 메시지입니다.
     * 네트워크/API/파싱 실패가 모두 같은 빈 배열로만 전달되면 실제 원인 추적이 불가능하므로, 서비스 내부의 마지막 실패 사유를 보존합니다.
     * @returns {string} - 마지막 API 또는 fallback 실패 메시지
     */
    get lastErrorMessage() {
        return this.#lastErrorMessage;
    }

    /**
     * @description 사용자가 입력한 YouTube URL(단일 영상 또는 재생목록)을 분석하여 재생 가능한 영상 목록 데이터로 변환합니다.
     * URL 객체 기반 파싱을 먼저 수행하고, 사용자가 잘라 붙인 불완전한 문자열까지 처리하기 위해 정규식 기반 fallback을 병행합니다.
     * @param {string} url - 사용자가 입력한 YouTube 영상 또는 재생목록 주소
     * @returns {Promise<Array<object>>} - 파싱 및 검증이 완료된 Entry 객체 배열
     */
    async fetchEntriesFromURL(url) {
        this.#lastErrorMessage = "";

        const parsed = this.#parseYouTubeURL(url);
        if (parsed.playlistId) return await this.#fetchPlaylistItems(parsed.playlistId);
        if (parsed.videoId) return await this.#fetchVideoItem(parsed.videoId);

        this.#lastErrorMessage = "YouTube URL에서 영상 ID 또는 재생목록 ID를 찾지 못했습니다.";
        return [];
    }

    /**
     * @description 이미 확보된 영상 ID에 대해 제목과 썸네일을 지연 보강합니다.
     * 재생목록 probing 단계에서는 IFrame API가 ID 배열만 반환하므로, UI를 먼저 열고 이후 oEmbed로 각 항목의 공개 메타데이터를 낮은 동시성으로 채웁니다.
     * @param {object} entry - id/title/img를 포함하는 현재 Entry 객체. 성공 시 동일 객체를 직접 갱신합니다.
     * @returns {Promise<object|null>} - 갱신된 Entry 객체 또는 실패 시 null
     */
    async hydrateEntryMetadata(entry) {
        if (!entry?.id || !entry.title?.startsWith("YouTube 영상 ")) return null;

        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${entry.id}`)}&format=json`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.title) throw new Error(data.error || `HTTP ${response.status}`);

            entry.title = data.title;
            entry.img ||= `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`;
            return entry;
        } catch (err) {
            console.warn(`oEmbed metadata lookup failed for ${entry.id}: ${err.message || err}`);
            return null;
        }
    }

    // --- Private Properties ---
    /**
     * @private
     * @description 최근 로드 작업에서 발생한 가장 구체적인 실패 사유입니다. 빈 배열 반환과 실제 장애를 구분하기 위해 별도로 보존합니다.
     * @type {string}
     */
    #lastErrorMessage = "";

    // --- Private Methods ---
    /**
     * @private
     * @description 다양한 YouTube 공유 URL 형식에서 재생목록 ID와 영상 ID를 추출합니다.
     * 모바일 YouTube 앱은 youtu.be, shorts, embed, music.youtube.com 등 서로 다른 형태의 링크를 만들 수 있으므로 한 경로에 고정하지 않습니다.
     * @param {string} source - 사용자가 입력한 원본 URL 또는 ID 문자열
     * @returns {{playlistId: string, videoId: string}} - 추출된 재생목록 ID와 영상 ID
     */
    #parseYouTubeURL(source) {
        const value = String(source || "").trim();
        let playlistId = "";
        let videoId = "";

        try {
            const parsed = new URL(value.includes("://") ? value : `https://${value}`);
            playlistId = parsed.searchParams.get("list") || "";
            videoId = parsed.searchParams.get("v") || "";

            if (!videoId) {
                const pathParts = parsed.pathname.split("/").filter(Boolean);
                if (["youtu.be", "www.youtu.be"].includes(parsed.hostname)) videoId = pathParts[0] || "";
                else if (["shorts", "embed", "live"].includes(pathParts[0])) videoId = pathParts[1] || "";
            }
        } catch { }

        playlistId ||= value.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1] || value.match(/(?:^|\s)(PL|UU|LL|RD|OLAK5uy_)[a-zA-Z0-9_-]+/)?.[0]?.trim() || "";
        videoId ||= value.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([a-zA-Z0-9_-]{11})/)?.[1] || (/^[a-zA-Z0-9_-]{11}$/.test(value) ? value : "");

        return { playlistId, videoId };
    }

    /**
     * @private
     * @description 재생목록 ID를 기반으로 IFrame API가 제공하는 현재 재생목록 ID 배열을 가져옵니다.
     * 제목/썸네일은 이 단계에서 알 수 없으므로, 로드 이후 oEmbed 지연 보강 루틴에서 채웁니다.
     * @param {string} playlistId - YouTube 공식 재생목록 고유 ID
     * @returns {Promise<Array<object>>} - 검증이 완료된 Entry 객체 배열
     */
    async #fetchPlaylistItems(playlistId) {
        const MAX_RESULTS = 200;

        try {
            const entries = await this.#fetchPlaylistItemsByIframeAPI(playlistId, MAX_RESULTS);
            if (entries.length) return entries;

            this.#lastErrorMessage = "IFrame API에서 재생목록 ID 배열을 가져오지 못했습니다.";
        } catch (err) {
            this.#lastErrorMessage = `IFrame API 재생목록 로드 실패: ${err.message || err}`;
            console.warn(this.#lastErrorMessage);
        }

        return [];
    }

    /**
     * @private
     * @description 숨김 YouTube 플레이어에 재생목록을 cue하여 YouTube Data API Key 없이 영상 ID 목록을 추출합니다.
     * 이 플레이어는 목록 ID probing 전용이며, 결과를 얻거나 타임아웃되면 즉시 destroy하여 iframe 누수와 모바일 메모리 누적을 방지합니다.
     * @param {string} playlistId - YouTube 공식 재생목록 고유 ID
     * @param {number} maxResults - 최대 수집 개수
     * @returns {Promise<Array<object>>} - IFrame API에서 확보한 영상 ID 기반 Entry 객체 배열
     */
    #fetchPlaylistItemsByIframeAPI(playlistId, maxResults) {
        return new Promise((resolve, reject) => {
            if (!window.YT?.Player) {
                reject(new Error("YouTube IFrame API가 아직 초기화되지 않았습니다."));
                return;
            }

            const probeHost = document.body.appendChild(document.createElement("div"));
            const probeId = `ytv-playlist-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            let probePlayer = null;
            let settled = false;
            let intervalId = 0;
            let timeoutId = 0;
            let lastProbeError = "";

            probeHost.id = `${probeId}-host`;
            probeHost.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
            probeHost.appendChild(Object.assign(document.createElement("div"), { id: probeId }));

            const cleanup = () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
                try { probePlayer?.destroy(); } catch { }
                probeHost.remove();
            };

            const finish = entries => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(entries);
            };

            const fail = error => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(error);
            };

            const collect = () => {
                const ids = [...new Set((probePlayer?.getPlaylist?.() || []).filter(id => /^[a-zA-Z0-9_-]{11}$/.test(id)))].slice(0, maxResults);
                if (ids.length) finish(ids.map((id, index) => ({
                    id,
                    title: `YouTube 영상 ${index + 1}`,
                    img: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
                })));
            };

            try {
                probePlayer = new YT.Player(probeId, {
                    width: 1,
                    height: 1,
                    playerVars: {
                        enablejsapi: 1,
                        origin: window.location.origin,
                        widget_referrer: window.location.origin,
                        playsinline: 1,
                        controls: 0,
                        rel: 0,
                        autoplay: 0,
                        listType: "playlist",
                        list: playlistId
                    },
                    events: {
                        onReady: () => {
                            probePlayer.cuePlaylist({ listType: "playlist", list: playlistId, index: 0 });
                            setTimeout(collect, 250);
                        },
                        onStateChange: collect,
                        onError: event => {
                            lastProbeError = `YouTube IFrame API 오류 코드 ${event.data}`;
                            collect();
                        }
                    }
                });
            } catch (err) {
                fail(err);
                return;
            }

            intervalId = setInterval(collect, 250);
            timeoutId = setTimeout(() => {
                collect();
                if (!settled) fail(new Error(lastProbeError || "재생목록 ID probing 시간이 초과되었습니다."));
            }, 8000);
        });
    }

    /**
     * @private
     * @description 단일 영상 ID를 기반으로 Entry 객체를 만들고 oEmbed로 공개 제목/썸네일을 보강합니다.
     * oEmbed가 실패하더라도 재생 자체는 IFrame 플레이어가 최종 판단하므로 placeholder Entry를 반환합니다.
     * @param {string} videoId - YouTube 영상 고유 ID
     * @returns {Promise<Array<object>>} - 유효성이 확인된 단일 Entry 객체가 담긴 배열
     */
    async #fetchVideoItem(videoId) {
        const entry = {
            id: videoId,
            title: "YouTube 영상 1",
            img: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        };

        await this.hydrateEntryMetadata(entry);
        return [entry];
    }
}


/**
 * @class UIManager
 * @description 플레이어 화면, 재생목록 관리 패널, 현재 대기열 목록의 DOM 생성과 상호작용을 담당합니다.
 * 플레이어 코어 로직과 UI 조작을 분리하여 재생 안정성에 영향을 주지 않고 레이아웃/UX를 개선할 수 있도록 구성합니다.
 */
class UIManager {
    // --- Public Properties ---
    TitleLabel = Dynamic.$("b");
    PlayLists = Dynamic.$("ul");
    EntryLists = Dynamic.$("ul", { style: "display: none;" });
    EntryState = Dynamic.$("li", { class: "entry-status" });
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" });
    listItemsContainer = Dynamic.$("div", { class: "ytv-list-inner" });
    PanelVisible = true;

    // --- Public Methods ---
    constructor(apiService) {
        this.#apiService = apiService;
    }

    setPlayerService(playerService) {
        this.#playerService = playerService;
    }

    /**
     * @description 플레이어 패널의 기본 골격을 초기화합니다.
     * 헤더는 현재 재생 제목과 목록/라이브러리 전환 토글을 동시에 담당합니다.
     */
    initializeBaseLayout() {
        this.ListHeader.reset(
            Dynamic.$("a", { href: "#", onclick: e => this.#togglePlaylistView(e) }).add(
                Dynamic.$("div", { class: "ytv-header-card" }).add(
                    Dynamic.$("img", {
                        src: "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s88-c-k-c0x00ffffff-no-rj",
                        loading: "lazy",
                        decoding: "async",
                        referrerpolicy: "no-referrer"
                    }),
                    Dynamic.$("div", { class: "ytv-header-text" }).add(
                        Dynamic.$("div", { class: "ytv-header-eyebrow", text: "NOW PLAYING" }),
                        Dynamic.$("span", { class: "playlist-title-label" }).add(this.TitleLabel)
                    ),
                    Dynamic.$("div", { class: "ytv-arrow-triangle", text: "▼" })
                )
            )
        );

        this.listItemsContainer.add(this.PlayLists, this.EntryLists);
        Dynamic.snipe(".ytv-list").reset(this.ListHeader, this.listItemsContainer);
        Dynamic.snipe(".ytv-panel-toggle-btn").set({ onclick: e => this.togglePanel(e) });
    }

    /**
     * @description 재생목록 패널을 접거나 펼칩니다.
     * 직접 width/height를 계속 덮어쓰지 않고 루트 클래스만 교체하여 CSS transition과 반응형 처리를 한 곳에서 관리합니다.
     */
    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible;
        document.getElementById("dynamic_player")?.classList.toggle("ytv-list-collapsed", !this.PanelVisible);
        e.currentTarget.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    /**
     * @description 현재 재생 중인 영상 정보를 헤더, 상태바, active row에 반영합니다.
     * active row는 사용자가 목록을 보고 있을 때만 주변으로 자연스럽게 이동되도록 nearest 스크롤을 사용합니다.
     */
    updateNowPlaying(entry, index, total) {
        if (!entry) return;
        this.TitleLabel.set({ text: entry.title });
        this.EntryState.set({ text: `${index + 1} / ${total}` });

        this.EntryLists.node.querySelector(".active")?.classList.remove("active");
        const items = this.EntryLists.node.querySelectorAll(".entry-item");
        if (items[index]) {
            items[index].classList.add("active");
            if (this.EntryLists.node.style.display !== "none") items[index].scrollIntoView({ block: "nearest" });
        }
    }

    /**
     * @description oEmbed 또는 실제 플레이어 상태에서 확인된 제목/썸네일을 기존 row에 부분 반영합니다.
     * 전체 목록 재생성을 피해서 모바일 스크롤 위치와 active 상태 흔들림을 막습니다.
     */
    updateEntryMetadata(index, entry) {
        const item = this.EntryLists.node.querySelectorAll(".entry-item")[index];
        if (!item || !entry) return;

        const image = item.querySelector("img");
        const title = item.querySelector("span");

        if (image && entry.img && image.src !== entry.img) image.src = entry.img;
        if (title && entry.title) title.textContent = entry.title;
    }

    /**
     * @description 저장된 라이브러리 목록과 새 URL 추가 폼을 렌더링합니다.
     */
    buildPlaylistList() {
        const playlistMap = DataResource.Data.basic.playlist || {};
        const titles = Object.keys(playlistMap).sort();
        this.PlayLists.reset(this.#createAddPlaylistCard());

        if (!titles.length) {
            this.PlayLists.add(
                Dynamic.$("li", { class: "entry-status", text: "저장된 YouTube 목록이 없습니다. 위 입력란에 URL을 추가해 주세요." })
            );
            return;
        }

        titles.forEach(title => {
            this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));
            Object.entries(playlistMap[title]).sort().forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(title, name, url)));
        });
    }

    /**
     * @description 현재 대기열을 렌더링합니다.
     * 검색 입력은 DOM 재생성 없이 row 표시만 토글하므로 100~200개 목록에서도 상호작용 비용이 작습니다.
     */
    buildEntryList(entries) {
        this.EntryLists.reset(this.#createEntryToolbar(entries.length), this.EntryState);
        entries.forEach((entry, i) => {
            this.EntryLists.add(
                Dynamic.$("li", { class: "entry-item", onclick: () => this.#playerService?.playVideoAt(i) }).add(
                    Dynamic.$("b", { text: i + 1 }),
                    Dynamic.$("img", { src: entry.img, loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" }),
                    Dynamic.$("span", { text: entry.title })
                )
            );
        });

        this.ListHeader.node.classList.add("ytv-playlist-open");
        this.PlayLists.set({ style: "display: none" });
        this.EntryLists.set({ style: "" });
    }

    // --- Private Properties ---
    #playerService = null;
    #apiService;
    #isFetching = false;

    // --- Private Methods ---
    #togglePlaylistView(e) {
        e.preventDefault();
        const showEntries = this.ListHeader.node.classList.toggle("ytv-playlist-open");
        this.PlayLists.set({ style: showEntries ? "display: none" : "" });
        this.EntryLists.set({ style: showEntries ? "" : "display: none" });
    }

    #createAddPlaylistCard() {
        return Dynamic.$("li", { class: "ytv-add-card" }).add(
            Dynamic.$("h3", { text: "YouTube 목록 추가" }),
            Dynamic.$("p", { text: "영상 URL, 재생목록 URL, 모바일 공유 링크를 그대로 붙여넣을 수 있습니다." }),
            Dynamic.$("input", { id: "input-main-title", placeholder: "분류 이름 · 예: 기본, 작업, 음악" }),
            Dynamic.$("input", { id: "input-playlist-url", placeholder: "YouTube URL" }),
            Dynamic.$("button", { text: "추가", id: "input-playlist-button", onclick: () => this.#addPlaylist() })
        );
    }

    #createEntryToolbar(total) {
        return Dynamic.$("li", { class: "ytv-entry-toolbar" }).add(
            Dynamic.$("div", { class: "ytv-entry-toolbar-row" }).add(
                Dynamic.$("div", { class: "ytv-entry-toolbar-title" }).add(
                    Dynamic.$("strong", { text: "재생 대기열" }),
                    Dynamic.$("span", { text: `${total}개의 영상 · 8개 윈도우 재생` })
                ),
                Dynamic.$("div", { class: "ytv-entry-controls" }).add(
                    this.#createControlButton("⟳", "새로고침", () => Dynamic.FragMutation.refresh()),
                    this.#createControlButton("⇄", "재생목록 섞기", () => this.#playerService?.shuffleEntries()),
                    this.#createControlButton("↩", "역순으로 재배치", () => this.#playerService?.reverseEntries()),
                    this.#createControlButton("🎯", "재생할 영상 선택", () => this.#playerService?.filterEntries())
                )
            ),
            Dynamic.$("input", {
                class: "ytv-entry-search",
                placeholder: "목록에서 제목 또는 번호 검색",
                oninput: e => this.#filterEntryList(e.target.value)
            })
        );
    }

    #filterEntryList(query) {
        const keyword = query.trim().toLowerCase();
        this.EntryLists.node.querySelectorAll(".entry-item").forEach((item, index) => {
            item.style.display = !keyword || `${index + 1} ${item.innerText}`.toLowerCase().includes(keyword) ? "" : "none";
        });
    }
    
    #addPlaylist() {
        const titleInput = document.getElementById("input-main-title");
        const urlInput = document.getElementById("input-playlist-url");
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();

        if (!title || !url) {
            pushSnackbar({ message: "분류 이름과 YouTube URL을 모두 입력해 주세요.", type: "error" });
            return;
        }

        const playlistMap = DataResource.Data.basic.playlist || {};
        if (!playlistMap[title]) playlistMap[title] = {};
        playlistMap[title][url] = url;

        DataResource.Data.updateData("playlist", playlistMap);
        DataResource.Data.synchronize();
        Dynamic.FragMutation.refresh();
    }

    #createPlaylistItem(title, name, url) {
        return Dynamic.$("li", { class: "playlist-item" }).add(
            Dynamic.$("a", { href: url, title: name, text: name, onclick: async e => {
                e.preventDefault();
                if (!this.#playerService || this.#isFetching) return;
                this.#isFetching = true;
                const progressSnackbar = pushProgressSnackbar({ message: "재생목록 구조를 확인하는 중입니다." });
                try {
                    const entries = await this.#apiService.fetchEntriesFromURL(url);
                    if (entries && entries.length > 0) {
                        progressSnackbar.update(`영상 정보 로드 중 0 / ${entries.length}`);
                        this.#playerService.loadNewPlaylist(entries, progressSnackbar);
                    } else progressSnackbar.close(this.#apiService.lastErrorMessage || "재생 가능한 영상이 없거나 로드에 실패했습니다.", "error");
                } catch (err) {
                    console.error(err);
                    progressSnackbar.close("알 수 없는 오류가 발생했습니다.", "error");
                } finally {
                    this.#isFetching = false;
                }
            }}),
            Dynamic.$("span", { class: "playlist-buttons" }).add(
                Dynamic.$("button", { class: "playerButton", text: "✎", title: "이름 변경", onclick: e => this.#editPlaylistName(e, title, name) }),
                Dynamic.$("button", { class: "playerButton", text: "×", title: "삭제", onclick: e => this.#deletePlaylist(e, title, name) })
            )
        );
    }

    #editPlaylistName(e, title, oldName) {
        e.stopPropagation();
        const newName = prompt("새 이름을 입력하세요", oldName);
        if (!newName || newName === oldName) return;
        const playlistMap = DataResource.Data.basic.playlist;
        if (playlistMap[title][newName]) {
            pushSnackbar({ message: "해당 이름은 이미 존재합니다.", type: "error" });
            return;
        }
        playlistMap[title][newName] = playlistMap[title][oldName];
        delete playlistMap[title][oldName];
        DataResource.Data.updateData("playlist", playlistMap);
        DataResource.Data.synchronize();
        Dynamic.FragMutation.refresh();
    }

    #deletePlaylist(e, title, name) {
        e.stopPropagation();
        if (!confirm("정말로 삭제하시겠습니까?")) return;
        const playlistMap = DataResource.Data.basic.playlist;
        delete playlistMap[title][name];
        if (Object.keys(playlistMap[title]).length === 0) delete playlistMap[title];
        DataResource.Data.updateData("playlist", playlistMap);
        DataResource.Data.synchronize();
        Dynamic.FragMutation.refresh();
    }
    
    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", type: "button", text: icon, title, onclick: onClick });
    }
}

/**
 * @class PlayerService
 * @description YouTube 플레이어 인스턴스의 생명주기 제어 및 셔플 등 핵심 재생 로직을 관리합니다.
 * 백그라운드 재생과 메모리 최적화를 위해 슬라이딩 윈도우(Sliding Window) 기법을 사용합니다.
 */
class PlayerService {
    constructor(uiManager, apiService) {
        this.#uiManager = uiManager;
        this.#apiService = apiService;

        // visibility 복귀 시에는 백그라운드에서 처리하지 못한 에러/예외성 pending reload만 정리합니다.
        // 정상적인 chunk boundary reload는 document.hidden 상태에서도 동일하게 수행합니다.
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) return;

            if (this.#pendingWindowReloadIndex >= 0) {
                const index = this.#pendingWindowReloadIndex;
                this.#pendingWindowReloadIndex = -1;
                this.#loadPlaylistWindow(index, this.#YTPlayer?.getCurrentTime?.() || 0);
            }

            // 일부 모바일 WebView/브라우저는 복귀 직후 iframe이 검은 화면 또는 CUED/ENDED 상태로 남는 경우가 있습니다.
            // 사용자가 이미 재생을 시작한 세션에서만 짧게 상태를 읽고 복구하므로, 최초 자동재생 정책을 우회하지 않습니다.
            clearTimeout(this.#visibleRecoveryTimer);
            this.#visibleRecoveryTimer = setTimeout(() => this.#recoverVisiblePlayback(), 180);
        });
    }

    refreshAll() {
        this.#uiManager.initializeBaseLayout();
        this.#uiManager.buildPlaylistList();
        this.initializePlayer();
    }

    /**
     * @description YouTube Iframe API를 기반으로 플레이어 인스턴스를 초기화합니다.
     */
    initializePlayer() {
        if (this.#YTPlayer) this.#YTPlayer.destroy();
        
        let playerContainer = document.getElementById("ytv-player");
        if (!playerContainer) {
            playerContainer = document.createElement("div");
            playerContainer.id = "ytv-player";
            playerContainer.className = "ytv-video";
            
            const dynamicPlayer = document.getElementById("dynamic_player");
            if (dynamicPlayer) {
                dynamicPlayer.insertBefore(playerContainer, dynamicPlayer.firstChild);
            }
        }

        this.#YTPlayer = new YT.Player("ytv-player", {
            playerVars: {
                // YouTube IFrame 내부 playlist queue가 모바일 백그라운드 상태에서도 가능한 한 자체적으로 다음 영상을 처리하도록
                // 플레이어 생성 시점에 모바일/임베드 친화 옵션을 명시합니다. chunk boundary에서는 사이트 JS가 같은 기준으로 queue를 재구성하고,
                // 그 외 일반적인 다음 영상 전환은 사용자가 시작한 iframe 재생 세션을 YouTube 내부 queue에 맡깁니다.
                enablejsapi: 1,
                origin: window.location.origin,
                widget_referrer: window.location.origin,
                playsinline: 1,
                autoplay: 1,
                controls: 1,
                disablekb: 0,
                fs: 1,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onReady: () => this.#onPlayerReady(),
                onStateChange: e => this.#onPlayerStateChange(e),
                onError: e => this.#onPlayerError(e)
            }
        });
    }
    
    /**
     * @description YConfig 배열을 바탕으로 슬라이딩 윈도우를 로드합니다.
     */
    loadPlaylist() {
        if (!YConfig.entries.length) return;

        let absIndex = YConfig.currentEntry ? YConfig.entries.findIndex(v => v.id === YConfig.currentEntry.id) : 0;
        if (absIndex < 0) absIndex = 0;

        YConfig.lastIdx = absIndex;
        YConfig.currentEntry = YConfig.entries[absIndex] || null;

        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, absIndex, YConfig.entries.length);
        this.#startMetadataHydration();
        this.#loadPlaylistWindow(absIndex, 0);
    }
    
    /**
     * @description 새로운 외부 재생목록이 로드되었을 때 플레이어를 초기화합니다.
     */
    loadNewPlaylist(entries, progressSnackbar = null) {
        YConfig.entries = entries;
        YConfig.currentEntry = entries[0] || null;
        YConfig.lastIdx = 0;
        localStorage.setItem("YConfig", JSON.stringify(YConfig));

        if (!this.#YTPlayer) {
            this.initializePlayer();
            return;
        }

        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, 0, YConfig.entries.length);
        this.#startMetadataHydration(progressSnackbar);
        this.#loadPlaylistWindow(0, 0);
    }
    
    /**
     * @description 커스텀 UI에서 특정 영상을 클릭하거나 다음 곡으로 넘어갈 때 해당 인덱스로 점프합니다.
     */
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;
        this.#loadPlaylistWindow(index, 0);
    }
    
    /**
     * @description 현재 재생 중인 영상을 제외한 나머지 대기열을 무작위로 섞어 새롭게 배치합니다.
     */
    shuffleEntries() {
        const current = YConfig.currentEntry;
        const others = YConfig.entries.filter(e => e.id !== current?.id);
        others.sort(() => Math.random() - 0.5);

        YConfig.entries = current ? [current, ...others] : others;
        YConfig.lastIdx = 0;
        YConfig.currentEntry = YConfig.entries[0] || null;

        localStorage.setItem("YConfig", JSON.stringify(YConfig));
        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, 0, YConfig.entries.length);
        this.#startMetadataHydration();
        this.#loadPlaylistWindow(0, 0);

        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }

    /**
     * @description 현재 대기열을 역순으로 재배치합니다.
     */
    reverseEntries() {
        YConfig.entries.reverse();
        YConfig.lastIdx = YConfig.entries.findIndex(e => e.id === YConfig.currentEntry?.id);
        if (YConfig.lastIdx < 0) YConfig.lastIdx = 0;
        YConfig.currentEntry = YConfig.entries[YConfig.lastIdx] || null;

        localStorage.setItem("YConfig", JSON.stringify(YConfig));
        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, YConfig.lastIdx, YConfig.entries.length);
        this.#startMetadataHydration();
        this.#loadPlaylistWindow(YConfig.lastIdx, 0);

        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }

    /**
     * @description 사용자 입력을 받아 현재 대기열에서 특정 영상만 추출해 새로운 재생목록을 구성합니다.
     */
    filterEntries() {
        const input = prompt(
            "재생할 영상 번호를 입력해 주세요 (띄어쓰기로 구분)\n\n" +
            "• 단일 번호 : 3 8 12\n" +
            "• 범위 입력 : 3-10 또는 3~10 (3~10번)\n" +
            "• 처음부터 : -5 또는 ~5 (1~5번)\n" +
            "• 끝까지   : 7- 또는 7~ (7~N번)\n\n" +
            "※ 단일 번호와 범위를 섞어 입력할 수 있습니다 (예: 2 5-9 11~)\n" +
            "※ '-' 또는 '~'는 숫자와 붙여 써야 하며, 번호는 현재 재생중인 목록을 따릅니다."
        );
        if (!input) return;

        const indices = new Set();
        const tokens = input.trim().split(/\s+/);
        const maxIndex = YConfig.entries.length;

        for (const token of tokens) {
            if (/^\d+$/.test(token)) indices.add(Number(token));
            else if (/^(\d+)[-~](\d+)$/.test(token)) {
                let [ a, b ] = token.match(/^(\d+)[-~](\d+)$/).slice(1).map(Number);
                for (let i = Math.min(a, b); i <= Math.max(a, b); i++) indices.add(i);
            } else if (/^[-~](\d+)$/.test(token)) {
                const end = Number(token.match(/^[-~](\d+)$/)[1]);
                for (let i = 1; i <= end; i++) indices.add(i);
            } else if (/^(\d+)[-~]$/.test(token)) {
                const start = Number(token.match(/^(\d+)[-~]$/)[1]);
                for (let i = start; i <= maxIndex; i++) indices.add(i);
            }
        }

        const parsed = [...indices].map(n => YConfig.entries[n - 1]).filter(Boolean);
        if (!parsed.length) {
            pushSnackbar({ message: "선택이 잘못되었습니다.", type: "error" });
            return;
        }

        YConfig.entries = parsed;
        YConfig.lastIdx = 0;
        YConfig.currentEntry = YConfig.entries[0] || null;

        localStorage.setItem("YConfig", JSON.stringify(YConfig));
        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, 0, YConfig.entries.length);
        this.#startMetadataHydration();
        this.#loadPlaylistWindow(0, 0);

        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" });
    }

    #YTPlayer = null;
    #uiManager;
    #apiService;
    #metadataHydrationToken = 0;

    // 전체 큐 대신 작은 윈도우만 플레이어에 탑재
    #windowSize = 8;
    #windowAbsIndices = [];
    #windowReloadLock = false;
    #windowReloadLockUntil = 0;
    #windowReloadTimer = null;
    #pendingWindowReloadIndex = -1;
    #autoAdvanceTimer = null;
    #playResumeTimer = null;
    #visibleRecoveryTimer = null;
    #autoAdvanceEnabled = false;

    /**
     * @private
     * @description YouTube Data API 없이 확보한 재생목록 항목의 제목/썸네일을 백그라운드에서 순차 보강합니다.
     * 재생 시작을 막지 않기 위해 await하지 않고, 모바일 브라우저에서 과도한 요청과 UI thrashing이 발생하지 않도록 동시성 3개와 소량의 지연을 둡니다.
     */
    #startMetadataHydration(progressSnackbar = null) {
        const total = YConfig.entries.length;
        const isPlaceholder = entry => entry?.title?.startsWith("YouTube 영상 ");
        const pendingCount = YConfig.entries.filter(isPlaceholder).length;

        if (!this.#apiService || !pendingCount) {
            progressSnackbar?.close(total ? `${total}개 영상 로드 완료` : "재생 가능한 영상이 없습니다.", total ? "normal" : "error");
            return;
        }

        const token = ++this.#metadataHydrationToken;
        const start = Math.max(YConfig.lastIdx, 0);
        const order = Array.from({ length: total }, (_, i) => (start + i) % total).filter(i => isPlaceholder(YConfig.entries[i]));
        const snackbar = progressSnackbar || pushProgressSnackbar({ message: `영상 정보 로드 중 ${total - pendingCount} / ${total}` });
        let cursor = 0;
        let loadedCount = total - pendingCount;
        let changedCount = 0;

        snackbar.update(`영상 정보 로드 중 ${loadedCount} / ${total}`);

        Promise.all(Array.from({ length: Math.min(3, order.length) }, async () => {
            while (token === this.#metadataHydrationToken && cursor < order.length) {
                const index = order[cursor++];
                const entry = await this.#apiService.hydrateEntryMetadata(YConfig.entries[index]);

                if (token !== this.#metadataHydrationToken) return;
                loadedCount++;
                if (entry) {
                    changedCount++;
                    this.#uiManager.updateEntryMetadata(index, entry);
                    if (index === YConfig.lastIdx) {
                        YConfig.currentEntry = entry;
                        this.#uiManager.updateNowPlaying(entry, index, YConfig.entries.length);
                        this.#syncMediaSession();
                    }
                    if (changedCount % 5 === 0) localStorage.setItem("YConfig", JSON.stringify(YConfig));
                }
                snackbar.update(`영상 정보 로드 중 ${Math.min(loadedCount, total)} / ${total}`);

                await new Promise(resolve => setTimeout(resolve, 60));
            }
        })).then(() => {
            if (token !== this.#metadataHydrationToken) return;
            if (changedCount) localStorage.setItem("YConfig", JSON.stringify(YConfig));
            snackbar.close(`${total}개 영상 로드 완료`, "normal");
        });
    }

    #loadPlaylistWindow(absIndex, startSeconds = 0) {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== "function") return;
        if (!YConfig.entries.length) return;

        const total = YConfig.entries.length;
        const size = Math.min(this.#windowSize, total);

        // 현재 곡 바로 앞 1곡부터 시작해서 총 size개를 원형으로 구성
        const start = ((absIndex - 1) % total + total) % total;
        this.#windowAbsIndices = Array.from({ length: size }, (_, i) => (start + i) % total);

        const ids = this.#windowAbsIndices.map(i => YConfig.entries[i].id);
        const localIndex = this.#windowAbsIndices.indexOf(absIndex);

        YConfig.lastIdx = absIndex;
        YConfig.currentEntry = YConfig.entries[absIndex] || null;
        localStorage.setItem("YConfig", JSON.stringify(YConfig));

        this.#uiManager.updateNowPlaying(YConfig.currentEntry, absIndex, YConfig.entries.length);
        this.#syncMediaSession(this.#autoAdvanceEnabled ? "playing" : null);

        this.#windowReloadLock = true;
        this.#windowReloadLockUntil = Date.now() + 400;
        this.#YTPlayer.loadPlaylist(ids, localIndex, startSeconds);
        this.#YTPlayer.setLoop(true);

        // 재생 중인 상태에서 chunk를 다시 물린 경우, 모바일 브라우저가 새 queue를 CUED/BUFFERING 상태로 멈춰두는 경우가 있습니다.
        // 사용자가 이미 재생을 시작한 세션에서는 다음 곡 전환과 chunk 재구성 이후에도 playVideo()를 짧게 재확인해 자동재생 흐름을 유지합니다.
        if (this.#autoAdvanceEnabled) this.#resumePlaybackAfterQueueMutation();

        clearTimeout(this.#windowReloadTimer);
        this.#windowReloadTimer = setTimeout(() => {
            this.#windowReloadLock = false;
            this.#windowReloadLockUntil = 0;
        }, 400);
    }

    #isWindowReloadLocked() {
        if (!this.#windowReloadLock) return false;
        if (Date.now() < this.#windowReloadLockUntil) return true;

        clearTimeout(this.#windowReloadTimer);
        this.#windowReloadLock = false;
        this.#windowReloadLockUntil = 0;
        return false;
    }

    #reloadPlaylistWindowForBoundary(absIndex) {
        // boundary에 도달하면 foreground/background 여부와 관계없이 같은 기준으로 chunk를 재구성합니다.
        // 이전 영상 1개를 포함하는 기존 window 구성과 YouTube 내부 loop 동작은 유지하되,
        // 백그라운드에서 reload를 보류해서 queue가 낡은 window 끝에서 첫 슬롯으로 감기는 문제를 막습니다.
        this.#pendingWindowReloadIndex = -1;
        this.#loadPlaylistWindow(absIndex, this.#YTPlayer?.getCurrentTime?.() || 0);
    }

    #resumePlaybackAfterQueueMutation() {
        // loadPlaylist()/nextVideo() 직후에는 IFrame 내부 상태가 곧바로 PLAYING으로 고정되지 않고,
        // 모바일 Chromium/WebView 계열에서 CUED 또는 BUFFERING 상태로 한 박자 멈추는 경우가 있습니다.
        // 이미 사용자가 재생을 시작한 세션에서만 짧게 playVideo()를 재호출해, 사용자가 직접 누른 재생 의사를 다음 영상 전환까지 보존합니다.
        clearTimeout(this.#playResumeTimer);
        this.#playResumeTimer = setTimeout(() => {
            if (!this.#YTPlayer || !this.#autoAdvanceEnabled) return;
            if (this.#YTPlayer.getPlayerState?.() !== YT.PlayerState.PLAYING) this.#YTPlayer.playVideo?.();
        }, 120);
    }

    #advanceAfterEnded() {
        // IFrame 내부 playlist가 정상적으로 다음 영상으로 넘어가지 못한 경우를 위한 보정입니다.
        // boundary reload와 마찬가지로 foreground/background 여부에 따라 보정 경로가 갈라지지 않게 유지합니다.
        // 화면이 다시 보이는 시점에는 #recoverVisiblePlayback()에서 검은 화면/ENDED/CUED 잔류 상태도 추가 복구합니다.
        if (!this.#autoAdvanceEnabled || !this.#YTPlayer || YConfig.entries.length < 2) return;

        clearTimeout(this.#autoAdvanceTimer);
        this.#autoAdvanceTimer = setTimeout(() => {
            if (!this.#YTPlayer || !this.#autoAdvanceEnabled || YConfig.entries.length < 2) return;

            const localIndex = this.#YTPlayer.getPlaylistIndex?.() ?? -1;
            if (localIndex >= 0 && localIndex < this.#windowAbsIndices.length - 1) {
                this.#YTPlayer.nextVideo?.();
                this.#resumePlaybackAfterQueueMutation();
                return;
            }

            this.#loadPlaylistWindow(((YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0) + 1) % YConfig.entries.length, 0);
        }, 80);
    }

    #recoverVisiblePlayback() {
        // 모바일에서 앱 복귀 직후 iframe이 검은 화면으로 남는 대부분의 케이스는 실제 player state가 ENDED/CUED/UNSTARTED에
        // 고정된 상태입니다. 이미 사용자가 재생을 시작했던 세션에서만 최소한의 복구 명령을 수행하여, 브라우저 autoplay 정책과
        // 충돌하지 않으면서 UI가 죽은 것처럼 보이는 상태를 줄입니다.
        if (document.hidden || !this.#YTPlayer || !this.#autoAdvanceEnabled) return;

        const state = this.#YTPlayer.getPlayerState?.();
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) return;
        if (state === YT.PlayerState.ENDED) {
            this.#advanceAfterEnded();
            return;
        }

        this.#resumePlaybackAfterQueueMutation();
    }

    #syncMediaSession(playbackState = null) {
        // Media Session은 백그라운드 재생 권한을 우회하는 장치가 아니라, OS 알림/잠금화면이 현재 iframe 재생 세션을
        // 더 정확히 추적하도록 도와주는 보조 레이어입니다. 제목/썸네일이 oEmbed로 늦게 보강되어도 이 메서드 한 곳에서
        // 현재 entry 기준으로 다시 반영합니다.
        if (!("mediaSession" in navigator)) return;

        if (playbackState) navigator.mediaSession.playbackState = playbackState;
        if (!YConfig.currentEntry || !("MediaMetadata" in window)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: YConfig.currentEntry.title || "Unknown Title",
            artist: "YouTube Player",
            album: "Necronomicon",
            artwork: [{
                src: YConfig.currentEntry.img || `https://i.ytimg.com/vi/${YConfig.currentEntry.id}/mqdefault.jpg`,
                sizes: "320x180",
                type: "image/jpeg"
            }]
        });
    }

    #onPlayerReady() {
        if ("mediaSession" in navigator) {
            const setMediaHandler = (action, handler) => {
                try { navigator.mediaSession.setActionHandler(action, handler); } catch { }
            };

            setMediaHandler("play", () => {
                this.#autoAdvanceEnabled = true;
                this.#YTPlayer?.playVideo?.();
                this.#syncMediaSession("playing");
            });

            setMediaHandler("pause", () => {
                this.#YTPlayer?.pauseVideo?.();
                this.#syncMediaSession("paused");
            });

            setMediaHandler("stop", () => {
                this.#autoAdvanceEnabled = false;
                this.#YTPlayer?.stopVideo?.();
                this.#syncMediaSession("none");
            });

            setMediaHandler("nexttrack", () => {
                if (YConfig.entries.length > 0) this.playVideoAt((YConfig.lastIdx + 1) % YConfig.entries.length);
            });

            setMediaHandler("previoustrack", () => {
                if (YConfig.entries.length > 0) this.playVideoAt((YConfig.lastIdx - 1 + YConfig.entries.length) % YConfig.entries.length);
            });

            setMediaHandler("seekbackward", details => this.#YTPlayer?.seekTo?.(Math.max((this.#YTPlayer?.getCurrentTime?.() || 0) - (details.seekOffset || 10), 0), true));
            setMediaHandler("seekforward", details => this.#YTPlayer?.seekTo?.((this.#YTPlayer?.getCurrentTime?.() || 0) + (details.seekOffset || 10), true));
        }

        this.loadPlaylist();
    }

    /**
     * @private
     * @description 미디어 세션 메타데이터 업데이트 및 슬라이딩 윈도우 진행을 제어합니다.
     */
    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            this.#advanceAfterEnded();
            return;
        }

        if (event.data === YT.PlayerState.PAUSED) {
            this.#syncMediaSession("paused");
            return;
        }

        if (event.data !== YT.PlayerState.PLAYING) return;

        this.#autoAdvanceEnabled = true;
        clearTimeout(this.#autoAdvanceTimer);
        clearTimeout(this.#playResumeTimer);

        const localIndex = this.#YTPlayer.getPlaylistIndex();
        const absIndex = this.#windowAbsIndices[localIndex];
        if (absIndex == null) return;

        if (absIndex !== YConfig.lastIdx) {
            YConfig.lastIdx = absIndex;
            YConfig.currentEntry = YConfig.entries[absIndex] || null;
            this.#uiManager.updateNowPlaying(YConfig.currentEntry, absIndex, YConfig.entries.length);
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
        }

        // IFrame API로 만든 항목은 최초에는 영상 ID만 확실하며 제목은 임시값일 수 있습니다.
        // oEmbed 보강보다 실제 재생이 먼저 시작된 경우 현재 플레이어의 videoData에서 제목을 얻을 수 있으므로,
        // 같은 영상 ID가 확인되는 경우에만 원본 entries 객체와 목록 DOM을 즉시 보정합니다.
        const videoData = this.#YTPlayer.getVideoData?.();
        if (videoData?.title && YConfig.currentEntry?.id === videoData.video_id && YConfig.currentEntry.title.startsWith("YouTube 영상 ")) {
            YConfig.currentEntry.title = videoData.title;
            YConfig.entries[absIndex].title = videoData.title;
            this.#uiManager.updateEntryMetadata(absIndex, YConfig.entries[absIndex]);
            this.#uiManager.updateNowPlaying(YConfig.currentEntry, absIndex, YConfig.entries.length);
            this.#syncMediaSession("playing");
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
        }

        this.#syncMediaSession("playing");

        // 윈도우 끝 곡 시점에 현재 곡 시점으로 윈도우를 앞으로 밀어준다.
        // 이렇게 해야 전체 200곡을 한 번에 안 올리면서도 내부 playlist 자동전환을 계속 활용할 수 있다.
        if (
            YConfig.entries.length > this.#windowSize &&
            (localIndex === 0 || localIndex >= this.#windowAbsIndices.length - 2) &&
            !this.#isWindowReloadLocked()
        ) {
            this.#reloadPlaylistWindowForBoundary(absIndex);
        }
    }

    /**
     * @private
     * @description 영상이 삭제되었거나 재생 불가능한 에러가 발생했을 때 자동으로 다음 곡으로 스킵합니다.
     */
    #onPlayerError(event) {
        const errorCode = event.data;
        const errorMsg = {
            2: "유효하지 않은 파라미터입니다.",
            5: "HTML5 플레이어 오류입니다.",
            100: "영상을 찾을 수 없거나 비공개 동영상입니다.",
            101: "이 영상은 퍼가기가 차단되었습니다.",
            150: "이 영상은 퍼가기가 차단되었습니다."
        }[errorCode] || "알 수 없는 오류입니다.";
        
        console.warn(`Playback Error (${errorCode}): ${errorMsg} - Skipping to next track.`);
        
        if (YConfig.entries.length > 1) {
            const safeIndex = YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0;
            const nextIndex = (safeIndex + 1) % YConfig.entries.length;
            
            // 백그라운드에서는 새 queue 로드를 강제하지 않고, 복귀 시 다음 안전 지점으로 재구성합니다.
            // 포그라운드에서는 재생 불가 영상에 머무르지 않도록 짧게 다음 곡으로 이동합니다.
            if (document.hidden) this.#pendingWindowReloadIndex = nextIndex;
            else setTimeout(() => this.playVideoAt(nextIndex), 100);
        } else pushSnackbar({ message: "재생할 수 있는 영상이 없습니다.", type: "error" });
    }
}

// ==========================================
// 3. 전역 인스턴스 초기화 및 모듈 내보내기
// ==========================================

let activePlayerService = null;

// 외부 스토리지 데이터 복원용 전역 인터페이스 함수
const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance;

// UI 컴포넌트 마운트 및 플레이어 모듈 최초 진입점 구성
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    // 플레이어 서비스 객체가 없을 때만 최초 초기화를 진행하여 메모리 중복 할당을 확실하게 방지합니다
    if (!activePlayerService) {
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);
        activePlayerService = new PlayerService(uiManager, apiService);
        uiManager.setPlayerService(activePlayerService);
    }
    
    // 레이아웃 렌더링 및 플레이어 리프레시 실행
    activePlayerService.refreshAll();
});

export { restoreYConfig };
export default Player;
