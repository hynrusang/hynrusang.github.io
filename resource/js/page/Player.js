import { Dynamic } from "../init/module.js";
import { pushProgressSnackbar, pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

// ==========================================
// 1. Player state and persistence
// ==========================================

/**
 * @description 저장된 재생 상태가 없거나 손상되었을 때 사용하는 최소 재생 항목입니다.
 * YouTube ID, 제목, 썸네일의 구조를 실제 대기열 항목과 동일하게 유지합니다.
 */
const DEFAULT_ENTRY = {
    id: "C0DPdy98e4c",
    img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
    title: "TEST VIDEO"
};

/**
 * @description YouTube iframe에 전달되는 현재 대기열과 재생 위치를 보존하는 전역 상태입니다.
 * @property {Array<object>} entries - iframe playlist 순서와 동일한 영상 목록
 * @property {number} lastIdx - 마지막으로 정상 재생이 확인된 인덱스
 * @property {object|null} currentEntry - 현재 재생 중인 영상 정보
 */
let YConfig = {
    entries: [DEFAULT_ENTRY],
    lastIdx: 0,
    currentEntry: DEFAULT_ENTRY
};

/**
 * @description 외부 저장소나 YouTube API에서 들어온 항목을 플레이어가 사용할 수 있는 형태로 정규화합니다.
 * 잘못된 11자리 영상 ID는 대기열에 포함하지 않습니다.
 * @param {object} entry
 * @returns {{id: string, title: string, img: string}|null}
 */
const normalizeEntry = entry => {
    const id = String(entry?.id || "").trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;

    return {
        id,
        title: String(entry?.title || "YouTube 영상").trim() || "YouTube 영상",
        img: String(entry?.img || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`).trim()
    };
};

/**
 * @description localStorage에서 복원한 재생 상태의 인덱스와 현재 항목을 실제 대기열 기준으로 다시 맞춥니다.
 * 저장 데이터가 일부 손상되어도 전체 Player 초기화가 중단되지 않게 합니다.
 * @param {object} source
 * @returns {{entries: Array<object>, lastIdx: number, currentEntry: object|null}}
 */
const normalizeYConfig = source => {
    const entries = Array.isArray(source?.entries) ? source.entries.map(normalizeEntry).filter(Boolean) : [];
    const safeEntries = entries.length ? entries : [normalizeEntry(DEFAULT_ENTRY)];
    const currentId = String(source?.currentEntry?.id || "");
    let lastIdx = safeEntries.findIndex(entry => entry.id === currentId);

    if (lastIdx < 0 && Number.isInteger(source?.lastIdx)) {
        lastIdx = Math.max(0, Math.min(source.lastIdx, safeEntries.length - 1));
    }
    if (lastIdx < 0) lastIdx = 0;

    return {
        entries: safeEntries,
        lastIdx,
        currentEntry: safeEntries[lastIdx] || null
    };
};

/** @description 현재 재생 상태를 localStorage에 저장합니다. */
const persistYConfig = () => localStorage.setItem("YConfig", JSON.stringify(YConfig));
/**
 * @description Firestore 저장 전 편집본을 만들기 위한 깊은 복사입니다.
 * 원본 LiveData 객체를 직접 변경하지 않아 저장 실패 시 rollback 기준을 보존합니다.
 */
const cloneData = value => typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

// ==========================================
// 2. YouTube URL and metadata service
// ==========================================

/**
 * @class YouTubeAPIService
 * @description YouTube URL을 단일 영상 또는 재생목록으로 해석하고,
 * IFrame API와 oEmbed만 사용해 영상 ID·제목·썸네일을 확보합니다.
 */
class YouTubeAPIService {
    #lastErrorMessage = "";

    /**
     * @description 가장 최근 URL/재생목록 조회 실패 원인을 UI에 전달합니다.
     * @returns {string}
     */
    get lastErrorMessage() {
        return this.#lastErrorMessage;
    }

    /**
     * @description 입력 문자열에서 지원 가능한 YouTube 영상 또는 재생목록 ID가 추출되는지 검사합니다.
     * @param {string} source
     * @returns {boolean}
     */
    isSupportedURL(source) {
        const parsed = this.#parseYouTubeURL(source);
        return Boolean(parsed.playlistId || parsed.videoId);
    }

    /**
     * @description YouTube URL을 분석해 Player 대기열 항목 배열로 변환합니다.
     * @param {string} url
     * @returns {Promise<Array<object>>}
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
     * @description IFrame probing 단계에서 ID만 확보한 항목에 oEmbed 제목과 썸네일을 지연 보강합니다.
     * @param {object} entry
     * @returns {Promise<object|null>}
     */
    async hydrateEntryMetadata(entry) {
        if (!entry?.id || !entry.title?.startsWith("YouTube 영상")) return null;

        try {
            const targetURL = `https://www.youtube.com/watch?v=${entry.id}`;
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetURL)}&format=json`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.title) throw new Error(data.error || `HTTP ${response.status}`);

            entry.title = data.title;
            entry.img ||= `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`;
            return entry;
        } catch (error) {
            console.warn(`oEmbed metadata lookup failed for ${entry.id}: ${error.message || error}`);
            return null;
        }
    }

    /**
     * @private
     * @description youtube.com, youtu.be, shorts, live, embed와 원시 ID 형식을 하나의 파서에서 처리합니다.
     * YouTube가 아닌 호스트의 임의 쿼리 문자열은 영상 주소로 오인하지 않습니다.
     * @param {string} source
     * @returns {{playlistId: string, videoId: string}}
     */
    #parseYouTubeURL(source) {
        const value = String(source || "").trim();
        let playlistId = "";
        let videoId = "";

        try {
            const parsed = new URL(value.includes("://") ? value : `https://${value}`);
            const hostname = parsed.hostname.toLowerCase();
            const isYouTubeHost = hostname === "youtu.be" || hostname.endsWith(".youtu.be")
                || hostname === "youtube.com" || hostname.endsWith(".youtube.com");

            if (isYouTubeHost) {
                playlistId = parsed.searchParams.get("list") || "";
                videoId = parsed.searchParams.get("v") || "";

                if (!videoId) {
                    const pathParts = parsed.pathname.split("/").filter(Boolean);
                    if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) videoId = pathParts[0] || "";
                    else if (["shorts", "embed", "live"].includes(pathParts[0])) videoId = pathParts[1] || "";
                }
            }
        } catch { }

        const looksLikeYouTubeURL = /(?:^|\.)youtube\.com(?:\/|$)|(?:^|\.)youtu\.be(?:\/|$)/i.test(value.replace(/^https?:\/\//i, ""));
        if (looksLikeYouTubeURL) {
            playlistId ||= value.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1] || "";
            videoId ||= value.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([a-zA-Z0-9_-]{11})/)?.[1] || "";
        }

        playlistId ||= value.match(/^(PL|UU|LL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/)?.[0] || "";
        videoId ||= /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : "";

        return { playlistId, videoId };
    }

    /**
     * @private
     * @description 숨김 iframe을 통해 공식 재생목록의 영상 ID 순서를 가져옵니다.
     * @param {string} playlistId
     * @returns {Promise<Array<object>>}
     */
    async #fetchPlaylistItems(playlistId) {
        const maxResults = 200;

        try {
            const entries = await this.#fetchPlaylistItemsByIframeAPI(playlistId, maxResults);
            if (entries.length) return entries;
            this.#lastErrorMessage = "IFrame API에서 재생목록 ID 배열을 가져오지 못했습니다.";
        } catch (error) {
            this.#lastErrorMessage = `IFrame API 재생목록 로드 실패: ${error.message || error}`;
            console.warn(this.#lastErrorMessage);
        }

        return [];
    }

    /**
     * @private
     * @description 임시 YouTube Player에 playlist를 cue한 뒤 getPlaylist() 결과를 수집합니다.
     * 완료·실패·timeout 어느 경로에서도 임시 iframe과 timer를 정리합니다.
     * @param {string} playlistId
     * @param {number} maxResults
     * @returns {Promise<Array<object>>}
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
                const ids = [...new Set((probePlayer?.getPlaylist?.() || [])
                    .filter(id => /^[a-zA-Z0-9_-]{11}$/.test(id)))]
                    .slice(0, maxResults);

                if (!ids.length) return;
                finish(ids.map((id, index) => ({
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
            } catch (error) {
                fail(error);
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
     * @description 단일 영상 ID를 한 항목짜리 대기열로 만들고 가능한 경우 제목을 보강합니다.
     * @param {string} videoId
     * @returns {Promise<Array<object>>}
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

// ==========================================
// 3. Player panel UI
// ==========================================

/**
 * @class UIManager
 * @description 저장된 목록 화면과 현재 재생 대기열 화면을 그립니다.
 * UI 갱신은 iframe 재생 상태를 직접 변경하지 않으며 PlayerService의 명시적 operation만 호출합니다.
 */
class UIManager {
    TitleLabel = Dynamic.$("b");
    PlayLists = Dynamic.$("ul");
    EntryLists = Dynamic.$("ul");
    EntryState = Dynamic.$("li", { class: "entry-status" });
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" });
    listItemsContainer = Dynamic.$("div", { class: "ytv-list-inner" });
    PanelVisible = true;

    #apiService;
    #playerService = null;
    #viewMode = YConfig.entries.length ? "queue" : "library";
    #isFetching = false;
    #entryErrors = new Map();

    /** @param {YouTubeAPIService} apiService */
    constructor(apiService) {
        this.#apiService = apiService;
    }

    /**
     * @description 목록 클릭과 재배치 명령을 실행할 PlayerService를 연결합니다.
     * @param {PlayerService} playerService
     */
    setPlayerService(playerService) {
        this.#playerService = playerService;
    }

    /**
     * @description Player Fragment가 표시될 때 패널 DOM만 연결합니다.
     * 이미 생성된 iframe과 대기열은 파괴하거나 재생성하지 않습니다.
     */
    mount() {
        this.ListHeader.reset(
            Dynamic.$("a", { href: "#", onclick: event => this.#togglePlaylistView(event) }).add(
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

        this.listItemsContainer.reset(this.PlayLists, this.EntryLists);
        Dynamic.snipe(".ytv-list").reset(this.ListHeader, this.listItemsContainer);
        Dynamic.snipe(".ytv-panel-toggle-btn").set({ onclick: event => this.togglePanel(event) });
        this.#applyViewMode();
        this.updateNowPlaying(YConfig.currentEntry, YConfig.lastIdx, YConfig.entries.length);
    }

    /** @description 우측 목록 패널의 접힘 상태만 변경합니다. */
    togglePanel(event) {
        this.PanelVisible = !this.PanelVisible;
        document.getElementById("dynamic_player")?.classList.toggle("ytv-list-collapsed", !this.PanelVisible);
        event.currentTarget.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    /** @description 저장된 YouTube 목록 화면을 표시합니다. */
    showLibrary() {
        this.#viewMode = "library";
        this.#applyViewMode();
    }

    /** @description 현재 iframe 대기열 화면을 표시합니다. */
    showQueue() {
        this.#viewMode = "queue";
        this.#applyViewMode();
    }

    /**
     * @description 재생 중 제목, 순번, 활성 행 표시를 현재 iframe 인덱스에 맞춥니다.
     */
    updateNowPlaying(entry, index, total) {
        if (!entry) {
            this.TitleLabel.set({ text: "재생 대기열 없음" });
            this.EntryState.set({ text: "0 / 0" });
            return;
        }

        this.TitleLabel.set({ text: entry.title });
        this.EntryState.set({ text: `${index + 1} / ${total}` });

        this.EntryLists.node.querySelector(".active")?.classList.remove("active");
        const item = this.EntryLists.node.querySelector(`.entry-item[data-index="${index}"]`);
        if (item) {
            item.classList.add("active");
            if (this.#viewMode === "queue") item.scrollIntoView({ block: "nearest" });
        }
    }

    /** @description 비동기로 확보된 제목과 썸네일만 해당 대기열 행에 반영합니다. */
    updateEntryMetadata(index, entry) {
        const item = this.EntryLists.node.querySelector(`.entry-item[data-index="${index}"]`);
        if (!item || !entry) return;

        const image = item.querySelector("img");
        const title = item.querySelector(".entry-title");
        if (image && entry.img && image.src !== entry.img) image.src = entry.img;
        if (title && entry.title) title.textContent = entry.title;
    }

    /** @description iframe에서 오류가 발생한 항목에 실패 상태를 표시합니다. */
    markEntryUnavailable(index, message) {
        this.#entryErrors.set(index, message);
        const item = this.EntryLists.node.querySelector(`.entry-item[data-index="${index}"]`);
        if (!item) return;

        item.classList.add("entry-unavailable");
        const label = item.querySelector(".entry-error");
        if (label) {
            label.textContent = message;
            label.hidden = false;
        }
    }

    /** @description 정상 재생이 확인된 항목의 이전 오류 표시를 제거합니다. */
    clearEntryError(index) {
        this.#entryErrors.delete(index);
        const item = this.EntryLists.node.querySelector(`.entry-item[data-index="${index}"]`);
        if (!item) return;

        item.classList.remove("entry-unavailable");
        const label = item.querySelector(".entry-error");
        if (label) {
            label.textContent = "";
            label.hidden = true;
        }
    }

    /** @description 새 대기열을 적용할 때 기존 오류 표시를 모두 초기화합니다. */
    clearAllEntryErrors() {
        this.#entryErrors.clear();
        this.EntryLists.node.querySelectorAll(".entry-item").forEach(item => item.classList.remove("entry-unavailable"));
        this.EntryLists.node.querySelectorAll(".entry-error").forEach(label => {
            label.textContent = "";
            label.hidden = true;
        });
    }

    /**
     * @description Firestore에 저장된 분류/표시 이름/URL 구조를 라이브러리 목록으로 다시 그립니다.
     * 현재 iframe과 재생 대기열은 변경하지 않습니다.
     */
    buildPlaylistList() {
        const previousScroll = this.PlayLists.node.scrollTop;
        const playlistMap = DataResource.Data.basic.playlist || {};
        const categories = Object.keys(playlistMap).sort((a, b) => a.localeCompare(b, "ko"));

        this.PlayLists.reset(this.#createAddPlaylistCard());

        if (!categories.length) {
            this.PlayLists.add(Dynamic.$("li", {
                class: "entry-status",
                text: "저장된 YouTube 목록이 없습니다. 위 입력란에 이름과 주소를 함께 등록해 주세요."
            }));
        } else {
            categories.forEach(category => {
                this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: category }));
                Object.entries(playlistMap[category])
                    .sort(([a], [b]) => a.localeCompare(b, "ko"))
                    .forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(category, name, url)));
            });
        }

        requestAnimationFrame(() => { this.PlayLists.node.scrollTop = previousScroll; });
    }

    /**
     * @description 현재 YConfig 순서로 대기열 행을 그립니다.
     * @param {Array<object>} entries
     * @param {{preserveScroll?: boolean, switchView?: boolean}} options
     */
    buildEntryList(entries, { preserveScroll = true, switchView = false } = {}) {
        const previousScroll = preserveScroll ? this.EntryLists.node.scrollTop : 0;
        this.EntryLists.reset(this.#createEntryToolbar(entries.length), this.EntryState);

        entries.forEach((entry, index) => {
            const errorMessage = this.#entryErrors.get(index) || "";
            const item = Dynamic.$("li", {
                class: `entry-item${errorMessage ? " entry-unavailable" : ""}`,
                "data-index": index,
                onclick: () => this.#playerService?.playVideoAt(index)
            }).add(
                Dynamic.$("b", { text: index + 1 }),
                Dynamic.$("img", {
                    src: entry.img,
                    loading: "lazy",
                    decoding: "async",
                    referrerpolicy: "no-referrer"
                }),
                Dynamic.$("span", { class: "entry-copy" }).add(
                    Dynamic.$("span", { class: "entry-title", text: entry.title }),
                    Dynamic.$("small", {
                        class: "entry-error",
                        text: errorMessage,
                        hidden: errorMessage ? undefined : true
                    })
                )
            );
            this.EntryLists.add(item);
        });

        if (switchView) this.showQueue();
        requestAnimationFrame(() => {
            this.EntryLists.node.scrollTop = previousScroll;
            this.updateNowPlaying(YConfig.currentEntry, YConfig.lastIdx, YConfig.entries.length);
        });
    }

    /** @private @description 라이브러리/대기열 중 선택된 한 화면만 표시합니다. */
    #applyViewMode() {
        const showQueue = this.#viewMode === "queue";
        this.ListHeader.node.classList.toggle("ytv-playlist-open", showQueue);
        this.PlayLists.set({ style: showQueue ? "display: none" : "" });
        this.EntryLists.set({ style: showQueue ? "" : "display: none" });
    }

    /** @private @description 상단 NOW PLAYING 카드를 눌렀을 때 두 목록 화면을 전환합니다. */
    #togglePlaylistView(event) {
        event.preventDefault();
        if (this.#viewMode === "queue") this.showLibrary();
        else this.showQueue();
    }

    /**
     * @private
     * @description 분류, 표시 이름, YouTube 주소를 명시적으로 입력하는 목록 추가 카드를 만듭니다.
     */
    #createAddPlaylistCard() {
        return Dynamic.$("li", { class: "ytv-add-card" }).add(
            Dynamic.$("h3", { text: "YouTube 목록 추가" }),
            Dynamic.$("p", {
                text: "분류는 목록을 묶는 폴더 이름이고, 표시 이름은 저장 목록에 실제로 보일 제목입니다. 단일 영상·재생목록·모바일 공유 URL을 지원합니다."
            }),
            Dynamic.$("form", { class: "ytv-add-form", autocomplete: "off", onsubmit: event => this.#addPlaylist(event) }).add(
                this.#createLabeledInput("분류", "input-main-title", "예: 기본, 작업, 음악", "기본"),
                this.#createLabeledInput("표시 이름", "input-playlist-name", "예: 출근길 음악, 강의 모음"),
                this.#createLabeledInput("YouTube 주소", "input-playlist-url", "https://www.youtube.com/watch?v=...", "", "url"),
                Dynamic.$("button", { text: "목록 저장", id: "input-playlist-button", type: "submit" })
            )
        );
    }

    /**
     * @private
     * @description Player 목록 폼용 label/input을 만들며 브라우저 자동완성 제안은 비활성화합니다.
     */
    #createLabeledInput(label, id, placeholder, value = "", type = "text") {
        return Dynamic.$("label", { class: "ytv-form-field" }).add(
            Dynamic.$("span", { text: label }),
            Dynamic.$("input", { id, type, placeholder, value, required: "", autocomplete: "off", spellcheck: "false" })
        );
    }

    /** @private @description 대기열 검색과 명시적 재배치 명령을 제공하는 도구 모음을 만듭니다. */
    #createEntryToolbar(total) {
        return Dynamic.$("li", { class: "ytv-entry-toolbar" }).add(
            Dynamic.$("div", { class: "ytv-entry-toolbar-row" }).add(
                Dynamic.$("div", { class: "ytv-entry-toolbar-title" }).add(
                    Dynamic.$("strong", { text: "재생 대기열" }),
                    Dynamic.$("span", { text: `${total}개의 영상 · 정상 종료 후 다음 재생은 YouTube iframe이 처리` })
                ),
                Dynamic.$("div", { class: "ytv-entry-controls" }).add(
                    this.#createControlButton("⟳", "목록 표시와 제목만 새로고침", () => this.#playerService?.refreshQueueView()),
                    this.#createControlButton("⇄", "재생목록 섞기", () => this.#playerService?.shuffleEntries()),
                    this.#createControlButton("↩", "역순으로 재배치", () => this.#playerService?.reverseEntries()),
                    this.#createControlButton("🎯", "재생할 영상 선택", () => this.#playerService?.filterEntries())
                )
            ),
            Dynamic.$("input", {
                class: "ytv-entry-search",
                placeholder: "목록에서 제목 또는 번호 검색",
                autocomplete: "off",
                spellcheck: "false",
                oninput: event => this.#filterEntryList(event.target.value)
            })
        );
    }

    /** @private @description iframe 대기열은 바꾸지 않고 화면에 보이는 행만 검색어로 필터링합니다. */
    #filterEntryList(query) {
        const keyword = query.trim().toLowerCase();
        this.EntryLists.node.querySelectorAll(".entry-item").forEach((item, index) => {
            item.style.display = !keyword || `${index + 1} ${item.innerText}`.toLowerCase().includes(keyword) ? "" : "none";
        });
    }

    /**
     * @private
     * @description 새 저장 목록을 검증하고 Firestore commit 성공 후 라이브러리 UI만 갱신합니다.
     * 현재 재생 중인 iframe과 탭 상태는 변경하지 않습니다.
     */
    async #addPlaylist(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const category = form.querySelector("#input-main-title").value.trim();
        const name = form.querySelector("#input-playlist-name").value.trim();
        const url = form.querySelector("#input-playlist-url").value.trim();

        if (!category || !name || !url) {
            pushSnackbar({ message: "분류, 표시 이름, YouTube 주소를 모두 입력해 주세요.", type: "error" });
            return;
        }
        if (!this.#apiService.isSupportedURL(url)) {
            pushSnackbar({ message: "지원되는 YouTube 영상 또는 재생목록 주소가 아닙니다.", type: "error" });
            return;
        }

        const nextPlaylistMap = cloneData(DataResource.Data.basic.playlist || {});
        nextPlaylistMap[category] ||= {};
        if (nextPlaylistMap[category][name]) {
            pushSnackbar({ message: "같은 분류에 동일한 표시 이름이 이미 존재합니다.", type: "error" });
            return;
        }

        nextPlaylistMap[category][name] = url;
        const committed = await DataResource.Data.commitBasicData("playlist", nextPlaylistMap);
        if (!committed) return;

        this.buildPlaylistList();
        this.showLibrary();
        form.querySelector("#input-playlist-name").value = "";
        form.querySelector("#input-playlist-url").value = "";
    }

    /** @private @description 저장 목록 한 행과 열기·수정·삭제 동작을 만듭니다. */
    #createPlaylistItem(category, name, url) {
        const row = Dynamic.$("li", { class: "playlist-item" });
        row.add(
            Dynamic.$("button", {
                class: "playlist-open-button",
                type: "button",
                title: `${name}\n${url}`,
                onclick: () => this.#openPlaylist(url)
            }).add(
                Dynamic.$("strong", { text: name }),
                Dynamic.$("small", { text: url })
            ),
            Dynamic.$("span", { class: "playlist-buttons" }).add(
                Dynamic.$("button", {
                    class: "playerButton",
                    type: "button",
                    text: "✎",
                    title: "분류·이름·주소 수정",
                    onclick: event => {
                        event.stopPropagation();
                        this.#openPlaylistEditor(row, category, name, url);
                    }
                }),
                Dynamic.$("button", {
                    class: "playerButton",
                    type: "button",
                    text: "×",
                    title: "삭제",
                    onclick: event => this.#deletePlaylist(event, category, name)
                })
            )
        );
        return row;
    }

    /**
     * @private
     * @description 사용자가 저장 목록을 명시적으로 선택했을 때만 URL을 해석해 새 iframe 대기열로 적용합니다.
     */
    async #openPlaylist(url) {
        if (!this.#playerService || this.#isFetching) return;

        this.#isFetching = true;
        const progressSnackbar = pushProgressSnackbar({ message: "재생목록 구조를 확인하는 중입니다." });
        try {
            const entries = await this.#apiService.fetchEntriesFromURL(url);
            if (!entries.length) {
                progressSnackbar.close(this.#apiService.lastErrorMessage || "재생 가능한 영상이 없거나 로드에 실패했습니다.", "error");
                return;
            }

            progressSnackbar.update(`영상 정보 로드 중 0 / ${entries.length}`);
            this.#playerService.loadNewPlaylist(entries, progressSnackbar);
        } catch (error) {
            console.error(error);
            progressSnackbar.close("재생목록을 불러오는 중 오류가 발생했습니다.", "error");
        } finally {
            this.#isFetching = false;
        }
    }

    /**
     * @private
     * @description prompt 대신 행 내부 편집 폼을 열어 분류·표시 이름·주소를 모두 수정할 수 있게 합니다.
     */
    #openPlaylistEditor(row, oldCategory, oldName, oldURL) {
        const form = Dynamic.$("form", {
            class: "playlist-edit-form",
            autocomplete: "off",
            onsubmit: event => this.#savePlaylistEdit(event, oldCategory, oldName)
        }).add(
            Dynamic.$("input", { name: "category", value: oldCategory, required: "", autocomplete: "off", spellcheck: "false", "aria-label": "분류" }),
            Dynamic.$("input", { name: "name", value: oldName, required: "", autocomplete: "off", spellcheck: "false", "aria-label": "표시 이름" }),
            Dynamic.$("input", { name: "url", value: oldURL, required: "", type: "url", autocomplete: "off", spellcheck: "false", "aria-label": "YouTube 주소" }),
            Dynamic.$("div", { class: "playlist-edit-actions" }).add(
                Dynamic.$("button", { type: "submit", text: "저장" }),
                Dynamic.$("button", { type: "button", text: "취소", onclick: () => this.buildPlaylistList() })
            )
        );

        row.reset(form);
        requestAnimationFrame(() => form.node.querySelector('[name="name"]')?.focus());
    }

    /**
     * @private
     * @description 편집본을 별도 객체로 저장하고 성공한 경우에만 라이브러리 목록을 갱신합니다.
     */
    async #savePlaylistEdit(event, oldCategory, oldName) {
        event.preventDefault();
        const form = event.currentTarget;
        const newCategory = form.elements.category.value.trim();
        const newName = form.elements.name.value.trim();
        const newURL = form.elements.url.value.trim();

        if (!newCategory || !newName || !newURL) {
            pushSnackbar({ message: "분류, 표시 이름, YouTube 주소를 모두 입력해 주세요.", type: "error" });
            return;
        }
        if (!this.#apiService.isSupportedURL(newURL)) {
            pushSnackbar({ message: "지원되는 YouTube 영상 또는 재생목록 주소가 아닙니다.", type: "error" });
            return;
        }

        const nextPlaylistMap = cloneData(DataResource.Data.basic.playlist || {});
        const oldURL = nextPlaylistMap[oldCategory]?.[oldName];
        if (!oldURL) {
            pushSnackbar({ message: "수정할 목록을 찾지 못했습니다. 목록을 다시 확인해 주세요.", type: "error" });
            this.buildPlaylistList();
            return;
        }

        const isSameKey = oldCategory === newCategory && oldName === newName;
        if (!isSameKey && nextPlaylistMap[newCategory]?.[newName]) {
            pushSnackbar({ message: "대상 분류에 동일한 표시 이름이 이미 존재합니다.", type: "error" });
            return;
        }

        delete nextPlaylistMap[oldCategory][oldName];
        if (!Object.keys(nextPlaylistMap[oldCategory]).length) delete nextPlaylistMap[oldCategory];
        nextPlaylistMap[newCategory] ||= {};
        nextPlaylistMap[newCategory][newName] = newURL;

        const committed = await DataResource.Data.commitBasicData("playlist", nextPlaylistMap);
        if (!committed) return;

        this.buildPlaylistList();
        this.showLibrary();
    }

    /** @private @description 확인 후 저장 목록 한 항목만 삭제하며 Player 대기열은 유지합니다. */
    async #deletePlaylist(event, category, name) {
        event.stopPropagation();
        if (!confirm(`'${name}' 목록을 삭제하시겠습니까?`)) return;

        const nextPlaylistMap = cloneData(DataResource.Data.basic.playlist || {});
        if (!nextPlaylistMap[category]?.[name]) return;

        delete nextPlaylistMap[category][name];
        if (!Object.keys(nextPlaylistMap[category]).length) delete nextPlaylistMap[category];

        const committed = await DataResource.Data.commitBasicData("playlist", nextPlaylistMap);
        if (!committed) return;

        this.buildPlaylistList();
        this.showLibrary();
    }

    /** @private @description 대기열 도구 모음의 공용 버튼을 만듭니다. */
    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", type: "button", text: icon, title, onclick: onClick });
    }
}

// ==========================================
// 4. YouTube iframe ownership and playback
// ==========================================

/**
 * @class PlayerService
 * @description YouTube Player 인스턴스와 YConfig 대기열을 소유합니다.
 * 일반적인 영상 종료 후 다음 재생은 iframe playlist에 맡기고,
 * 앱은 사용자가 목록을 교체·재배치한 경우와 오류 복구 시에만 명시적으로 iframe API를 호출합니다.
 */
class PlayerService {
    #YTPlayer = null;
    #uiManager;
    #apiService;
    #metadataHydrationToken = 0;
    #playerReady = false;
    #playerInitTimer = 0;
    #loadedQueueSignature = "";
    #pendingQueueLoad = null;
    #errorRecovery = null;
    #errorRecoveryTimer = 0;
    #failedIndicesInPass = new Set();

    /**
     * @param {UIManager} uiManager
     * @param {YouTubeAPIService} apiService
     */
    constructor(uiManager, apiService) {
        this.#uiManager = uiManager;
        this.#apiService = apiService;
    }

    /**
     * @description Fragment가 표시될 때 UI를 다시 연결하고 Player가 없을 때만 iframe을 생성합니다.
     */
    mount() {
        this.#uiManager.mount();
        this.#uiManager.buildPlaylistList();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: true });
        this.#startMetadataHydration();
        this.#ensurePlayer();
    }

    /**
     * @description 사용자가 선택한 새 목록을 정규화해 YConfig와 iframe playlist에 적용합니다.
     * @param {Array<object>} entries
     */
    loadNewPlaylist(entries, progressSnackbar = null) {
        const normalizedEntries = entries.map(normalizeEntry).filter(Boolean);
        if (!normalizedEntries.length) {
            progressSnackbar?.close("재생 가능한 영상이 없습니다.", "error");
            return;
        }

        YConfig.entries = normalizedEntries;
        YConfig.currentEntry = normalizedEntries[0];
        YConfig.lastIdx = 0;
        persistYConfig();

        this.#resetPlaybackErrors();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: false, switchView: true });
        this.#startMetadataHydration(progressSnackbar);
        this.#requestQueueLoad(0, 0);
    }

    /** @description 사용자가 대기열 행을 직접 선택했을 때 iframe의 해당 인덱스를 재생합니다. */
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;
        if (!this.#YTPlayer || typeof this.#YTPlayer.playVideoAt !== "function") return;

        this.#clearErrorRecovery();
        this.#updateCurrentEntry(index, true);
        this.#YTPlayer.playVideoAt(index);
    }

    /** @description iframe을 다시 만들지 않고 현재 대기열 표시와 제목 보강만 다시 수행합니다. */
    refreshQueueView() {
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: true });
        this.#startMetadataHydration();
        pushSnackbar({ message: "재생을 유지한 채 대기열 표시를 새로고침했습니다.", type: "normal" });
    }

    /**
     * @description 현재 영상과 재생 시간을 보존한 채 나머지 대기열 순서만 섞어 iframe에 다시 적용합니다.
     */
    shuffleEntries() {
        const current = YConfig.currentEntry;
        const currentSeconds = Number(this.#YTPlayer?.getCurrentTime?.() || 0);
        const others = YConfig.entries.filter(entry => entry.id !== current?.id);

        for (let index = others.length - 1; index > 0; index--) {
            const target = Math.floor(Math.random() * (index + 1));
            [others[index], others[target]] = [others[target], others[index]];
        }

        YConfig.entries = current ? [current, ...others] : others;
        YConfig.lastIdx = 0;
        YConfig.currentEntry = YConfig.entries[0] || null;
        persistYConfig();

        this.#resetPlaybackErrors();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: false, switchView: true });
        this.#startMetadataHydration();
        this.#requestQueueLoad(0, currentSeconds);
        pushSnackbar({ message: "현재 영상은 유지하고 이후 대기열을 섞었습니다.", type: "normal" });
    }

    /** @description 현재 영상과 재생 시간을 보존한 채 전체 대기열 순서를 반전합니다. */
    reverseEntries() {
        const currentId = YConfig.currentEntry?.id;
        const currentSeconds = Number(this.#YTPlayer?.getCurrentTime?.() || 0);

        YConfig.entries.reverse();
        YConfig.lastIdx = Math.max(0, YConfig.entries.findIndex(entry => entry.id === currentId));
        YConfig.currentEntry = YConfig.entries[YConfig.lastIdx] || null;
        persistYConfig();

        this.#resetPlaybackErrors();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: false, switchView: true });
        this.#startMetadataHydration();
        this.#requestQueueLoad(YConfig.lastIdx, currentSeconds);
        pushSnackbar({ message: "현재 영상 위치를 유지하고 대기열 순서를 뒤집었습니다.", type: "normal" });
    }

    /**
     * @description 사용자가 입력한 번호/범위로 새 대기열을 구성합니다.
     * 검색 표시 필터와 달리 이 operation은 iframe playlist 자체를 변경합니다.
     */
    filterEntries() {
        const input = prompt(
            "재생할 영상 번호를 입력해 주세요 (띄어쓰기로 구분)\n\n" +
            "• 단일 번호 : 3 8 12\n" +
            "• 범위 입력 : 3-10 또는 3~10\n" +
            "• 처음부터 : -5 또는 ~5\n" +
            "• 끝까지   : 7- 또는 7~\n\n" +
            "예: 2 5-9 11~"
        );
        if (!input) return;

        const indices = new Set();
        const tokens = input.trim().split(/\s+/);
        const maxIndex = YConfig.entries.length;

        for (const token of tokens) {
            if (/^\d+$/.test(token)) indices.add(Number(token));
            else if (/^(\d+)[-~](\d+)$/.test(token)) {
                let [start, end] = token.match(/^(\d+)[-~](\d+)$/).slice(1).map(Number);
                [start, end] = [Math.min(start, end), Math.max(start, end)];
                for (let index = start; index <= end; index++) indices.add(index);
            } else if (/^[-~](\d+)$/.test(token)) {
                const end = Number(token.match(/^[-~](\d+)$/)[1]);
                for (let index = 1; index <= end; index++) indices.add(index);
            } else if (/^(\d+)[-~]$/.test(token)) {
                const start = Number(token.match(/^(\d+)[-~]$/)[1]);
                for (let index = start; index <= maxIndex; index++) indices.add(index);
            }
        }

        const filteredEntries = [...indices].map(number => YConfig.entries[number - 1]).filter(Boolean);
        if (!filteredEntries.length) {
            pushSnackbar({ message: "선택한 번호에서 재생 가능한 영상을 찾지 못했습니다.", type: "error" });
            return;
        }

        const currentId = YConfig.currentEntry?.id;
        const currentSeconds = Number(this.#YTPlayer?.getCurrentTime?.() || 0);
        const currentIndex = filteredEntries.findIndex(entry => entry.id === currentId);

        YConfig.entries = filteredEntries;
        YConfig.lastIdx = currentIndex >= 0 ? currentIndex : 0;
        YConfig.currentEntry = YConfig.entries[YConfig.lastIdx] || null;
        persistYConfig();

        this.#resetPlaybackErrors();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: false, switchView: true });
        this.#startMetadataHydration();
        this.#requestQueueLoad(YConfig.lastIdx, currentIndex >= 0 ? currentSeconds : 0);
        pushSnackbar({ message: `선택한 ${filteredEntries.length}개의 영상으로 대기열을 구성했습니다.`, type: "normal" });
    }

    /**
     * @private
     * @description 기존 iframe 인스턴스가 유효하면 재사용하고, 실제 DOM host가 없을 때만 새 Player를 생성합니다.
     */
    #ensurePlayer() {
        clearTimeout(this.#playerInitTimer);

        let existingIframe = null;
        try { existingIframe = this.#YTPlayer?.getIframe?.() || null; } catch { }
        if (existingIframe?.isConnected) return;

        if (!window.YT?.Player) {
            this.#playerInitTimer = setTimeout(() => this.#ensurePlayer(), 200);
            return;
        }

        if (this.#YTPlayer) {
            try { this.#YTPlayer.destroy(); } catch { }
            this.#YTPlayer = null;
            this.#playerReady = false;
        }

        let playerContainer = document.getElementById("ytv-player");
        if (playerContainer?.tagName === "IFRAME") {
            const replacement = document.createElement("div");
            replacement.id = "ytv-player";
            replacement.className = "ytv-video";
            playerContainer.replaceWith(replacement);
            playerContainer = replacement;
        }

        if (!playerContainer) {
            playerContainer = document.createElement("div");
            playerContainer.id = "ytv-player";
            playerContainer.className = "ytv-video";
            document.getElementById("dynamic_player")?.prepend(playerContainer);
        }

        this.#YTPlayer = new YT.Player("ytv-player", {
            playerVars: {
                enablejsapi: 1,
                origin: window.location.origin,
                widget_referrer: window.location.origin,
                playsinline: 1,
                rel: 0,
                autoplay: 1
            },
            events: {
                onReady: () => this.#onPlayerReady(),
                onStateChange: event => this.#onPlayerStateChange(event),
                onError: event => this.#onPlayerError(event)
            }
        });
    }

    /** @private @description iframe 준비 전 목록 변경 요청을 한 건으로 보관하거나 즉시 적용합니다. */
    #requestQueueLoad(index, startSeconds) {
        this.#pendingQueueLoad = { index, startSeconds };
        if (!this.#playerReady) {
            this.#ensurePlayer();
            return;
        }

        const pending = this.#pendingQueueLoad;
        this.#pendingQueueLoad = null;
        this.#loadFullPlaylist(pending.index, pending.startSeconds);
    }

    /**
     * @private
     * @description 현재 YConfig ID 순서를 한 번의 loadPlaylist 호출로 iframe에 전달합니다.
     * 이후 정상 종료에 따른 다음 영상 선택은 YouTube iframe이 수행합니다.
     */
    #loadFullPlaylist(index, startSeconds = 0) {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== "function") return;
        if (!YConfig.entries.length) return;

        const ids = YConfig.entries.map(entry => entry.id);
        const safeIndex = Math.max(0, Math.min(index, ids.length - 1));

        this.#updateCurrentEntry(safeIndex, true);
        this.#loadedQueueSignature = ids.join(",");
        this.#YTPlayer.loadPlaylist(ids, safeIndex, Math.max(0, startSeconds));
        this.#YTPlayer.setLoop(true);
    }

    /**
     * @private
     * @description placeholder 제목만 낮은 동시성으로 보강하고 중간 결과를 localStorage에 저장합니다.
     */
    #startMetadataHydration(progressSnackbar = null) {
        const total = YConfig.entries.length;
        const isPlaceholder = entry => entry?.title?.startsWith("YouTube 영상");
        const pendingCount = YConfig.entries.filter(isPlaceholder).length;

        if (!this.#apiService || !pendingCount) {
            progressSnackbar?.close(total ? `${total}개 영상 로드 완료` : "재생 가능한 영상이 없습니다.", total ? "normal" : "error");
            return;
        }

        const token = ++this.#metadataHydrationToken;
        const start = Math.max(YConfig.lastIdx, 0);
        const order = Array.from({ length: total }, (_, index) => (start + index) % total)
            .filter(index => isPlaceholder(YConfig.entries[index]));
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
                    if (index === YConfig.lastIdx) this.#updateCurrentEntry(index, false);
                    if (changedCount % 5 === 0) persistYConfig();
                }
                snackbar.update(`영상 정보 로드 중 ${Math.min(loadedCount, total)} / ${total}`);
                await new Promise(resolve => setTimeout(resolve, 60));
            }
        })).then(() => {
            if (token !== this.#metadataHydrationToken) return;
            if (changedCount) persistYConfig();
            snackbar.close(`${total}개 영상 로드 완료`, "normal");
        });
    }

    /** @private @description iframe 인덱스를 YConfig와 NOW PLAYING UI에 동기화합니다. */
    #updateCurrentEntry(index, persist) {
        if (index < 0 || index >= YConfig.entries.length) return;

        YConfig.lastIdx = index;
        YConfig.currentEntry = YConfig.entries[index] || null;
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length);
        if (persist) persistYConfig();
    }

    /** @private @description iframe이 알고 있는 실제 제목으로 placeholder 항목을 보정합니다. */
    #syncCurrentTitleFromPlayer(index) {
        const videoData = this.#YTPlayer?.getVideoData?.();
        if (!videoData?.title || !videoData?.video_id) return;
        if (YConfig.entries[index]?.id !== videoData.video_id) return;
        if (!YConfig.entries[index].title.startsWith("YouTube 영상")) return;

        YConfig.entries[index].title = videoData.title;
        YConfig.currentEntry = YConfig.entries[index];
        this.#uiManager.updateEntryMetadata(index, YConfig.entries[index]);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length);
        persistYConfig();
    }

    /** @private @description OS 미디어 세션의 재생 상태와 현재 영상 메타데이터를 갱신합니다. */
    #updateMediaSession(state) {
        if (!("mediaSession" in navigator)) return;

        navigator.mediaSession.playbackState = state;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: YConfig.currentEntry?.title || "Unknown Title",
            artist: "YouTube Player",
            artwork: [{ src: YConfig.currentEntry?.img || "", sizes: "320x180", type: "image/jpeg" }]
        });
    }

    /**
     * @private
     * @description iframe 준비 완료 후 보류 중인 목록 변경을 적용하고 미디어 키 동작을 연결합니다.
     */
    #onPlayerReady() {
        this.#playerReady = true;

        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("nexttrack", () => this.#YTPlayer?.nextVideo?.());
            navigator.mediaSession.setActionHandler("previoustrack", () => this.#YTPlayer?.previousVideo?.());
        }

        if (this.#pendingQueueLoad) {
            const pending = this.#pendingQueueLoad;
            this.#pendingQueueLoad = null;
            this.#loadFullPlaylist(pending.index, pending.startSeconds);
            return;
        }

        const signature = YConfig.entries.map(entry => entry.id).join(",");
        if (signature && signature !== this.#loadedQueueSignature) {
            this.#loadFullPlaylist(YConfig.lastIdx, 0);
        }
    }

    /**
     * @private
     * @description PLAYING 상태에서만 현재 인덱스를 확정하고 오류 복구 잠금을 해제합니다.
     */
    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            const index = this.#YTPlayer.getPlaylistIndex();
            if (index < 0 || index >= YConfig.entries.length) return;

            this.#clearErrorRecovery();
            this.#failedIndicesInPass.clear();
            this.#uiManager.clearEntryError(index);
            const shouldPersist = index !== YConfig.lastIdx;
            this.#updateCurrentEntry(index, shouldPersist);
            this.#syncCurrentTitleFromPlayer(index);
            this.#updateMediaSession("playing");
            return;
        }

        if (event.data === YT.PlayerState.PAUSED) {
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
            return;
        }

        if (event.data === YT.PlayerState.BUFFERING && "mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "none";
        }
    }

    /**
     * @private
     * @description 동일 영상의 중복 오류 이벤트를 한 번으로 합치고 nextVideo()를 한 번만 요청합니다.
     * 정상 재생이 확인되기 전에는 같은 오류를 다시 처리하지 않아 정상 영상까지 연쇄 스킵되는 현상을 막습니다.
     */
    #onPlayerError(event) {
        const errorCode = event.data;
        const errorMessage = {
            2: "잘못된 영상 주소",
            5: "HTML5 재생 오류",
            100: "삭제·비공개 영상",
            101: "외부 재생 차단",
            150: "외부 재생 차단"
        }[errorCode] || "알 수 없는 재생 오류";
        const index = this.#YTPlayer?.getPlaylistIndex?.();
        const safeIndex = Number.isInteger(index) && index >= 0 && index < YConfig.entries.length ? index : YConfig.lastIdx;
        const videoId = YConfig.entries[safeIndex]?.id || "";

        if (this.#errorRecovery?.index === safeIndex && this.#errorRecovery?.videoId === videoId) return;

        this.#failedIndicesInPass.add(safeIndex);
        this.#uiManager.markEntryUnavailable(safeIndex, errorMessage);
        pushSnackbar({ message: `${safeIndex + 1}번 영상을 재생할 수 없습니다. YouTube가 다음 영상으로 이동합니다.`, type: "error", duration: 2600 });

        if (YConfig.entries.length <= 1 || this.#failedIndicesInPass.size >= YConfig.entries.length) {
            this.#clearErrorRecovery();
            this.#YTPlayer?.stopVideo?.();
            pushSnackbar({ message: "대기열에서 재생 가능한 영상을 찾지 못했습니다.", type: "error", duration: 3200 });
            return;
        }

        this.#errorRecovery = { index: safeIndex, videoId };
        clearTimeout(this.#errorRecoveryTimer);
        this.#errorRecoveryTimer = setTimeout(() => {
            if (!this.#errorRecovery || this.#errorRecovery.index !== safeIndex || this.#errorRecovery.videoId !== videoId) return;

            try {
                this.#YTPlayer?.nextVideo?.();
            } catch (error) {
                console.warn("YouTube nextVideo failed", error);
                this.#clearErrorRecovery();
                return;
            }

            this.#errorRecoveryTimer = setTimeout(() => {
                if (!this.#errorRecovery || this.#errorRecovery.index !== safeIndex || this.#errorRecovery.videoId !== videoId) return;

                const currentIndex = this.#YTPlayer?.getPlaylistIndex?.();
                if (currentIndex !== safeIndex) {
                    this.#clearErrorRecovery();
                    return;
                }

                this.#clearErrorRecovery();
                pushSnackbar({
                    message: "YouTube가 다음 영상으로 이동하지 못했습니다. 대기열에서 다른 영상을 선택해 주세요.",
                    type: "error",
                    duration: 3200
                });
            }, 2200);
        }, 180);
    }

    /** @private @description 현재 오류 복구 timer와 중복 처리 잠금을 해제합니다. */
    #clearErrorRecovery() {
        clearTimeout(this.#errorRecoveryTimer);
        this.#errorRecoveryTimer = 0;
        this.#errorRecovery = null;
    }

    /** @private @description 새 대기열 적용 시 오류 통계와 UI 표시를 모두 초기화합니다. */
    #resetPlaybackErrors() {
        this.#clearErrorRecovery();
        this.#failedIndicesInPass.clear();
        this.#uiManager.clearAllEntryErrors();
    }
}

// ==========================================
// 5. Fragment bootstrap
// ==========================================

/** @type {PlayerService|null} Player Fragment가 숨겨져도 유지되는 단일 서비스 인스턴스입니다. */
let activePlayerService = null;

/**
 * @description 로그인 복원 단계에서 저장된 재생 상태를 검증한 뒤 YConfig에 반영합니다.
 */
const restoreYConfig = savedPlayerInstance => {
    YConfig = normalizeYConfig(savedPlayerInstance);
};

/**
 * @description 다른 main 화면과 분리된 player Fragment입니다.
 * 페이지 전환 시 DOM은 숨겨질 뿐 제거되지 않아 iframe 재생 상태가 유지됩니다.
 */
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open", type: "button", title: "목록 패널 열기/닫기" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    if (!activePlayerService) {
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);
        activePlayerService = new PlayerService(uiManager, apiService);
        uiManager.setPlayerService(activePlayerService);
    }

    activePlayerService.mount();
});

export { restoreYConfig };
export default Player;
