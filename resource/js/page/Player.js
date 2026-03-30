import { Dynamic } from "../init/module.js";
import { pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

// --- 초기 설정 및 상태 관리 ---

/**
 * @description YouTube 플레이어 및 재생목록 데이터의 상태를 관리하는 전역 설정 객체입니다.
 * @property {Array<object>} entries - 현재 재생 목록의 영상 정보 배열
 * @property {number} lastIdx - 마지막으로 재생된 영상의 인덱스
 * @property {object|null} currentEntry - 현재 재생 중인 영상의 Entry 객체
 */
let YConfig = {
    entries: [{
        id: "C0DPdy98e4c",
        img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
        title: "TEST VIDEO"
    }],
    lastIdx: -1,
    currentEntry: null,
};

// --- 서비스 클래스 정의 ---

/**
 * @class YouTubeAPIService
 * @description YouTube Data API v3 관련 로직을 처리합니다. (영상 정보 가져오기 유효성 검사 등)
 */
class YouTubeAPIService {
    // --- Public Methods ---
    /**
     * @description YouTube URL(단일 영상 또는 재생목록)에서 재생 가능한 영상 목록을 가져옵니다.
     * @param {string} url - YouTube 영상 또는 재생목록 URL
     * @returns {Promise<Array<object>>} - Entry 객체 배열
     */
    async fetchEntriesFromURL(url) {
        const playlistIdMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        const videoIdMatch = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

        try {
            if (playlistIdMatch) return await this.#fetchPlaylistItems(playlistIdMatch[1]);
            if (videoIdMatch) return await this.#fetchVideoItem(videoIdMatch[1]);
            return [];
        } catch (err) {
            console.error("❌ API 호출 실패:", err);
            pushSnackbar({ message: "데이터를 가져오는 데 실패했습니다.", type: "error" });
            return [];
        }
    }

    // --- Private Properties ---
    /**
     * @private
     * @type {string}
     */
    #apiKey = "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo";

    // --- Private Methods ---
    /**
     * @private
     * @description 영상 ID가 실제로 재생 가능한지 oEmbed 엔드포인트를 통해 확인합니다.
     * @param {string} videoId - 확인할 YouTube 영상 ID
     * @returns {Promise<boolean>} - 재생 가능 여부
     */
    async #validateVideo(videoId) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
            return response.ok;
        } catch (error) {
            console.error(`Video validation failed for ${videoId}:`, error);
            return false;
        }
    }
    
    /**
     * @private
     * @description 재생목록 ID를 사용하여 모든 항목을 가져오고 유효성을 검사합니다. (최대 200개)
     * @param {string} playlistId - YouTube 재생목록 ID
     * @returns {Promise<Array<object>>} - 유효한 Entry 객체 배열
     */
    async #fetchPlaylistItems(playlistId) {
        let allEntries = [];
        let pageToken = "";
        const MAX_RESULTS = 200;
        
        while (true) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.#apiKey}&part=snippet&maxResults=50${pageToken ?
            `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`;

            try {
                const res = await fetch(apiUrl);
                const data = await res.json();
                
                if (data.error) {
                    pushSnackbar({ message: `목록 로드 실패: ${data.error.message}`, type: "error" });
                    break;
                }
                
                if (!data.items) break;

                const fetchedEntries = data.items
                    .filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
                    .map(item => ({
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
                    }));

                allEntries.push(...fetchedEntries);
                pageToken = data.nextPageToken;
                
                if (allEntries.length >= MAX_RESULTS || !pageToken) break;

            } catch (err) {
                console.error("Network Error:", err);
                break;
            }
        }
        
        return allEntries;
    }
    
    /**
     * @private
     * @description 단일 영상 ID를 사용하여 정보를 가져오고 유효성을 검사합니다.
     * @param {string} videoId - YouTube 영상 ID
     * @returns {Promise<Array<object>>} - 유효한 Entry 객체가 담긴 배열 (또는 빈 배열)
     */
    async #fetchVideoItem(videoId) {
        if (!await this.#validateVideo(videoId)) {
            pushSnackbar({ message: "사용할 수 없는 동영상입니다.", type: "error" });
            return [];
        }
        
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.#apiKey}`);
        const data = await res.json();
        const video = data.items[0];

        if (!video) return [];

        return [{
            id: video.id,
            title: video.snippet.title,
            img: video.snippet.thumbnails.medium?.url ||
            video.snippet.thumbnails.default?.url
        }];
    }
}


/**
 * @class UIManager
 * @description UI 생성 및 업데이트 사용자 상호작용 관련 로직을 처리합니다.
 */
class UIManager {
    // --- Public Properties ---
    TitleLabel = Dynamic.$("b");
    PlayLists = Dynamic.$("ul");
    EntryLists = Dynamic.$("ul", { style: "display: none;" });
    EntryState = Dynamic.$("li", { class: "entry-status", style: "padding: 4px 8px; font-weight: bold; color: #999;" });
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

    initializeBaseLayout() {
        this.ListHeader.reset(
            Dynamic.$("a", { href: "#", onclick: e => this.#togglePlaylistView(e) }).add(
                Dynamic.$("img", { src: "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s88-c-k-c0x00ffffff-no-rj" }),
                Dynamic.$("span", { class: "playlist-title-label" }).add(
                    this.TitleLabel,
                    Dynamic.$("div", { class: "ytv-arrow-triangle", text: "▼" })
                )
            )
        );

        this.listItemsContainer.add(this.PlayLists, this.EntryLists);
        Dynamic.snipe(".ytv-list").reset(this.ListHeader, this.listItemsContainer);
        Dynamic.snipe(".ytv-panel-toggle-btn").set({ onclick: e => this.togglePanel(e) });
    }

    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible;
        const list = document.querySelector('.ytv-list');
        list.style.width = this.PanelVisible ? "" : "0";
        list.style.height = this.PanelVisible ? "" : "0";
        e.target.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    updateNowPlaying(entry, index, total) {
        this.TitleLabel.set({ text: entry.title });
        this.EntryState.set({ text: `${index + 1} / ${total}` });

        const activeNode = this.EntryLists.node.querySelector(".active");
        if (activeNode) activeNode.classList.remove("active");
        
        const items = this.EntryLists.node.querySelectorAll(".entry-item");
        if (items[index]) {
            items[index].classList.add("active");
        }
    }

    buildPlaylistList() {
        const playlistMap = DataResource.Data.basic.playlist;
        this.PlayLists.reset();

        this.PlayLists.add(
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-main-title", style: "width: 100%; margin-bottom: 8px;", placeholder: "큰 타이틀" })),
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-playlist-url", style: "width: 100%; margin-bottom: 8px;", placeholder: "YouTube URL" })),
            Dynamic.$("li").add(Dynamic.$("button", { text: "➕ 추가", id: "input-playlist-button", onclick: () => this.#addPlaylist() }))
        );

        Object.keys(playlistMap).sort().forEach(title => {
            this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));
            Object.entries(playlistMap[title]).sort().forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(title, name, url)) );
        });
    }

    buildEntryList(entries) {
        this.EntryLists.reset();

        if (entries.length > 1) {
            this.EntryLists.add(
                this.#createControlButton("🔄", "새로고침", () => Dynamic.FragMutation.refresh()),
                this.#createControlButton("🔀", "재생목록 섞기", () => this.#playerService?.shuffleEntries()),
                this.#createControlButton("↩️", "역순으로 재배치", () => this.#playerService?.reverseEntries()),
                this.#createControlButton("🎯", "재생할 영상 선택", () => this.#playerService?.filterEntries())
            );
        }

        this.EntryLists.add(this.EntryState);
        entries.forEach((entry, i) => {
            this.EntryLists.add(
                Dynamic.$("li", { class: "entry-item", onclick: () => this.#playerService?.playVideoAt(i) }).add(
                    Dynamic.$("b", { text: i + 1 }),
                    Dynamic.$("img", { src: entry.img }),
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
    
    #addPlaylist() {
        const titleInput = document.getElementById("input-main-title");
        const urlInput = document.getElementById("input-playlist-url");
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();

        if (!title || !url) {
            pushSnackbar({ message: "모든 입력란을 채워주세요.", type: "error" });
            return;
        }

        const playlistMap = DataResource.Data.basic.playlist;
        if (!playlistMap[title]) playlistMap[title] = {};
        playlistMap[title][url] = url;

        DataResource.Data.updateData("playlist", playlistMap);
        DataResource.Data.synchronize();
        Dynamic.FragMutation.refresh();
    }

    #createPlaylistItem(title, name, url) {
        return Dynamic.$("li", { class: "playlist-item" }).add(
            Dynamic.$("a", { href: url, text: name, onclick: async e => {
                e.preventDefault();
                if (!this.#playerService || this.#isFetching) return;
                this.#isFetching = true;
                pushSnackbar({ message: `'${name}' 목록을 불러오는 중...`, type: "normal" })
                try {
                    const entries = await this.#apiService.fetchEntriesFromURL(url);
                    if (entries && entries.length > 0) {
                        this.#playerService.loadNewPlaylist(entries);
                        pushSnackbar({ message: "재생목록 로드 완료!", type: "normal" });
                    } else pushSnackbar({ message: "재생 가능한 영상이 없거나 로드에 실패했습니다.", type: "error" });
                } catch (err) {
                    console.error(err);
                    pushSnackbar({ message: "알 수 없는 오류가 발생했습니다.", type: "error" });
                } finally {
                    this.#isFetching = false;
                }
            }}),
            Dynamic.$("span", { class: "playlist-buttons" }).add(
                Dynamic.$("button", { class: "playerButton", text: "✏️", onclick: e => this.#editPlaylistName(e, title, name) }),
                Dynamic.$("button", { class: "playerButton", text: "❌", onclick: e => this.#deletePlaylist(e, title, name) })
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
        return Dynamic.$("button", { class: "playerButton", text: icon, title, onclick: onClick });
    }
}

/**
 * @class PlayerService
 * @description YouTube 플레이어 인스턴스 상태 및 핵심 제어 로직을 관리합니다.
 */
class PlayerService {
    // --- Public Methods ---
    constructor(uiManager) {
        this.#uiManager = uiManager;
        this.#initKeepAliveAudio();
    }

    refreshAll() {
        this.#uiManager.initializeBaseLayout();
        this.#uiManager.buildPlaylistList();
        this.initializePlayer();
    }

    initializePlayer() {
        if (this.#YTPlayer) {
            this.#YTPlayer.destroy();
            this.#YTPlayer = null;
        }

        if (!YConfig.entries || YConfig.entries.length === 0) return;

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

        const initialVideoId = YConfig.currentEntry ?
        YConfig.currentEntry.id : YConfig.entries[0].id;

        this.#YTPlayer = new YT.Player("ytv-player", {
            host: 'https://www.youtube.com',
            origin: window.location.origin,
            videoId: initialVideoId,
            playerVars: {
                "enablejsapi": 1,
                "origin": window.location.origin,
                "playsinline": 1,
                "rel": 0
            },
            events: { 
                "onReady": () => this.#onPlayerReady(),
                "onStateChange": e => this.#onPlayerStateChange(e),
                "onError": e => this.#onPlayerError(e)
            }
        });
    }

    /**
     * @description 네이티브 재생목록으로 전체 영상을 로드합니다.
     */
    loadPlaylist() {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== 'function') return;
        if (!YConfig.entries.length) return;
        
        let playIndex = YConfig.currentEntry ? YConfig.entries.findIndex(e => e.id === YConfig.currentEntry.id) : -1;

        if (playIndex === -1) {
            playIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
        }
        YConfig.lastIdx = playIndex;

        const videoIds = YConfig.entries.map(entry => entry.id);
        
        this.#YTPlayer.loadPlaylist({
            playlist: videoIds,
            index: playIndex,
        });

        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, playIndex, YConfig.entries.length);
    }
    
    loadNewPlaylist(entries) {
        YConfig.entries = entries;
        YConfig.currentEntry = entries[0] || null;
        this.initializePlayer();
    }
    
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;
        YConfig.currentEntry = YConfig.entries[index];
        YConfig.lastIdx = index;
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length);
        this.#YTPlayer.playVideoAt(index);
    }
    
    shuffleEntries() {
        YConfig.entries.sort(() => Math.random() - 0.5);
        this.loadPlaylist();
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }

    reverseEntries() {
        YConfig.entries.reverse();
        this.loadPlaylist();
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }

    filterEntries() {
        const input = prompt(
            "재생할 영상 번호를 입력해 주세요 (띄어쓰기로 구분)\n\n" +
            "• 단일 번호 : 3 8 12\n" +
            "• 범위 입력 : 3-10 또는 3~10 (3~10번)\n" +
            "• 처음부터 : -5 또는 ~5 (1~5번)\n" +
            "• 끝까지   : 7- 또는 7~ (7~N번)\n\n" +
            "※ 단일 번호와 범위를 섞어 입력할 수 있습니다 (예: 2 5-9 11~)\n" +
            "※ '-' 또는 '~'는 숫자와 붙여 써야 하며 번호는 현재 재생중인 목록을 따릅니다."
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
        this.loadPlaylist();
        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" });
    }

    // --- Private Properties ---
    #YTPlayer = null;
    #uiManager;
    #keepAliveAudio = null;

    // --- Private Methods ---
    #initKeepAliveAudio() {
        this.#keepAliveAudio = new Audio();
        this.#keepAliveAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        this.#keepAliveAudio.loop = true;
        this.#keepAliveAudio.volume = 0;
    }

    #onPlayerReady() {
        if (YConfig.entries.length > 0) this.loadPlaylist();
        this.#uiManager.buildEntryList(YConfig.entries);
    }

    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.#keepAliveAudio?.play().catch(() => {});
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

            const nativeIndex = this.#YTPlayer.getPlaylistIndex();
            if (nativeIndex >= 0 && nativeIndex !== YConfig.lastIdx) {
                YConfig.lastIdx = nativeIndex;
                YConfig.currentEntry = YConfig.entries[nativeIndex];
                this.#uiManager.updateNowPlaying(YConfig.currentEntry, nativeIndex, YConfig.entries.length);
            }
        } 
        else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            this.#keepAliveAudio?.pause();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            
            // 중지 및 종료 시점에 상태를 저장하여 부하를 방지합니다.
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
        }
    }

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
            setTimeout(() => this.playVideoAt(nextIndex), 100);
        } else pushSnackbar({ message: "재생할 수 있는 영상이 없습니다.", type: "error" });
    }
}

// --- 전역 인스턴스 및 내보내기 ---
let activePlayerService = null;
const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance;
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    if (!activePlayerService) {
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);
        activePlayerService = new PlayerService(uiManager);
        uiManager.setPlayerService(activePlayerService);
    }
    activePlayerService.refreshAll();
});
export { restoreYConfig };
export default Player;
