import { Dynamic } from "../init/module.js";
import { pushProgressSnackbar, pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

const DEFAULT_ENTRY = {
    id: "C0DPdy98e4c",
    img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
    title: "TEST VIDEO"
};

let YConfig = {
    entries: [DEFAULT_ENTRY],
    lastIdx: 0,
    currentEntry: DEFAULT_ENTRY
};

const normalizeEntry = entry => {
    const id = String(entry?.id || "").trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;

    return {
        id,
        title: String(entry?.title || "YouTube 영상").trim() || "YouTube 영상",
        img: String(entry?.img || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`).trim()
    };
};

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

const persistYConfig = () => localStorage.setItem("YConfig", JSON.stringify(YConfig));
const cloneData = value => typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

class YouTubeAPIService {
    #lastErrorMessage = "";

    get lastErrorMessage() {
        return this.#lastErrorMessage;
    }

    isSupportedURL(source) {
        const parsed = this.#parseYouTubeURL(source);
        return Boolean(parsed.playlistId || parsed.videoId);
    }

    async fetchEntriesFromURL(url) {
        this.#lastErrorMessage = "";

        const parsed = this.#parseYouTubeURL(url);
        if (parsed.playlistId) return await this.#fetchPlaylistItems(parsed.playlistId);
        if (parsed.videoId) return await this.#fetchVideoItem(parsed.videoId);

        this.#lastErrorMessage = "YouTube URL에서 영상 ID 또는 재생목록 ID를 찾지 못했습니다.";
        return [];
    }

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

    constructor(apiService) {
        this.#apiService = apiService;
    }

    setPlayerService(playerService) {
        this.#playerService = playerService;
    }

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

    togglePanel(event) {
        this.PanelVisible = !this.PanelVisible;
        document.getElementById("dynamic_player")?.classList.toggle("ytv-list-collapsed", !this.PanelVisible);
        event.currentTarget.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    showLibrary() {
        this.#viewMode = "library";
        this.#applyViewMode();
    }

    showQueue() {
        this.#viewMode = "queue";
        this.#applyViewMode();
    }

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

    updateEntryMetadata(index, entry) {
        const item = this.EntryLists.node.querySelector(`.entry-item[data-index="${index}"]`);
        if (!item || !entry) return;

        const image = item.querySelector("img");
        const title = item.querySelector(".entry-title");
        if (image && entry.img && image.src !== entry.img) image.src = entry.img;
        if (title && entry.title) title.textContent = entry.title;
    }

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

    clearAllEntryErrors() {
        this.#entryErrors.clear();
        this.EntryLists.node.querySelectorAll(".entry-item").forEach(item => item.classList.remove("entry-unavailable"));
        this.EntryLists.node.querySelectorAll(".entry-error").forEach(label => {
            label.textContent = "";
            label.hidden = true;
        });
    }

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

    #applyViewMode() {
        const showQueue = this.#viewMode === "queue";
        this.ListHeader.node.classList.toggle("ytv-playlist-open", showQueue);
        this.PlayLists.set({ style: showQueue ? "display: none" : "" });
        this.EntryLists.set({ style: showQueue ? "" : "display: none" });
    }

    #togglePlaylistView(event) {
        event.preventDefault();
        if (this.#viewMode === "queue") this.showLibrary();
        else this.showQueue();
    }

    #createAddPlaylistCard() {
        return Dynamic.$("li", { class: "ytv-add-card" }).add(
            Dynamic.$("h3", { text: "YouTube 목록 추가" }),
            Dynamic.$("p", {
                text: "분류는 목록을 묶는 폴더 이름이고, 표시 이름은 저장 목록에 실제로 보일 제목입니다. 단일 영상·재생목록·모바일 공유 URL을 지원합니다."
            }),
            Dynamic.$("form", { class: "ytv-add-form", onsubmit: event => this.#addPlaylist(event) }).add(
                this.#createLabeledInput("분류", "input-main-title", "예: 기본, 작업, 음악", "기본"),
                this.#createLabeledInput("표시 이름", "input-playlist-name", "예: 출근길 음악, 강의 모음"),
                this.#createLabeledInput("YouTube 주소", "input-playlist-url", "https://www.youtube.com/watch?v=...", "", "url"),
                Dynamic.$("button", { text: "목록 저장", id: "input-playlist-button", type: "submit" })
            )
        );
    }

    #createLabeledInput(label, id, placeholder, value = "", type = "text") {
        return Dynamic.$("label", { class: "ytv-form-field" }).add(
            Dynamic.$("span", { text: label }),
            Dynamic.$("input", { id, type, placeholder, value, required: "" })
        );
    }

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
                oninput: event => this.#filterEntryList(event.target.value)
            })
        );
    }

    #filterEntryList(query) {
        const keyword = query.trim().toLowerCase();
        this.EntryLists.node.querySelectorAll(".entry-item").forEach((item, index) => {
            item.style.display = !keyword || `${index + 1} ${item.innerText}`.toLowerCase().includes(keyword) ? "" : "none";
        });
    }

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

    #openPlaylistEditor(row, oldCategory, oldName, oldURL) {
        const form = Dynamic.$("form", {
            class: "playlist-edit-form",
            onsubmit: event => this.#savePlaylistEdit(event, oldCategory, oldName)
        }).add(
            Dynamic.$("input", { name: "category", value: oldCategory, required: "", "aria-label": "분류" }),
            Dynamic.$("input", { name: "name", value: oldName, required: "", "aria-label": "표시 이름" }),
            Dynamic.$("input", { name: "url", value: oldURL, required: "", type: "url", "aria-label": "YouTube 주소" }),
            Dynamic.$("div", { class: "playlist-edit-actions" }).add(
                Dynamic.$("button", { type: "submit", text: "저장" }),
                Dynamic.$("button", { type: "button", text: "취소", onclick: () => this.buildPlaylistList() })
            )
        );

        row.reset(form);
        requestAnimationFrame(() => form.node.querySelector('[name="name"]')?.focus());
    }

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

    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", type: "button", text: icon, title, onclick: onClick });
    }
}

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

    constructor(uiManager, apiService) {
        this.#uiManager = uiManager;
        this.#apiService = apiService;
    }

    mount() {
        this.#uiManager.mount();
        this.#uiManager.buildPlaylistList();
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: true });
        this.#startMetadataHydration();
        this.#ensurePlayer();
    }

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

    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;
        if (!this.#YTPlayer || typeof this.#YTPlayer.playVideoAt !== "function") return;

        this.#clearErrorRecovery();
        this.#updateCurrentEntry(index, true);
        this.#YTPlayer.playVideoAt(index);
    }

    refreshQueueView() {
        this.#uiManager.buildEntryList(YConfig.entries, { preserveScroll: true });
        this.#startMetadataHydration();
        pushSnackbar({ message: "재생을 유지한 채 대기열 표시를 새로고침했습니다.", type: "normal" });
    }

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

    #updateCurrentEntry(index, persist) {
        if (index < 0 || index >= YConfig.entries.length) return;

        YConfig.lastIdx = index;
        YConfig.currentEntry = YConfig.entries[index] || null;
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length);
        if (persist) persistYConfig();
    }

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

    #updateMediaSession(state) {
        if (!("mediaSession" in navigator)) return;

        navigator.mediaSession.playbackState = state;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: YConfig.currentEntry?.title || "Unknown Title",
            artist: "YouTube Player",
            artwork: [{ src: YConfig.currentEntry?.img || "", sizes: "320x180", type: "image/jpeg" }]
        });
    }

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

    #clearErrorRecovery() {
        clearTimeout(this.#errorRecoveryTimer);
        this.#errorRecoveryTimer = 0;
        this.#errorRecovery = null;
    }

    #resetPlaybackErrors() {
        this.#clearErrorRecovery();
        this.#failedIndicesInPass.clear();
        this.#uiManager.clearAllEntryErrors();
    }
}

let activePlayerService = null;

const restoreYConfig = savedPlayerInstance => {
    YConfig = normalizeYConfig(savedPlayerInstance);
};

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
