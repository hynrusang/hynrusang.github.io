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
}; [cite: 309]

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
        const playlistIdMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/); [cite: 312]
        const videoIdMatch = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); [cite: 313]

        try {
            if (playlistIdMatch) return await this.#fetchPlaylistItems(playlistIdMatch[1]); [cite: 313]
            if (videoIdMatch) return await this.#fetchVideoItem(videoIdMatch[1]); [cite: 314]
            return [];
        } catch (err) {
            console.error("❌ API 호출 실패:", err); [cite: 314]
            pushSnackbar({ message: "데이터를 가져오는 데 실패했습니다.", type: "error" }); [cite: 315]
            return [];
        }
    }

    // --- Private Properties ---
    /**
     * @private
     * @type {string}
     */
    #apiKey = "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo"; [cite: 316]

    // --- Private Methods ---
    /**
     * @private
     * @description 영상 ID가 실제로 재생 가능한지 oEmbed 엔드포인트를 통해 확인합니다.
     * @param {string} videoId - 확인할 YouTube 영상 ID
     * @returns {Promise<boolean>} - 재생 가능 여부
     */
    async #validateVideo(videoId) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`); [cite: 318]
            return response.ok; [cite: 319]
        } catch (error) {
            console.error(`Video validation failed for ${videoId}:`, error); [cite: 319]
            return false; [cite: 320]
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
        let pageToken = ""; [cite: 321, 322]
        const MAX_RESULTS = 200; [cite: 322]
        
        while (true) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.#apiKey}&part=snippet&maxResults=50${pageToken ?
            `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`; [cite: 322, 323]

            try {
                const res = await fetch(apiUrl); [cite: 323]
                const data = await res.json(); [cite: 324]
                
                if (data.error) {
                    pushSnackbar({ message: `목록 로드 실패: ${data.error.message}`, type: "error" }); [cite: 324]
                    break; [cite: 325]
                }
                
                if (!data.items) break; [cite: 325]

                const fetchedEntries = data.items
                    .filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video') [cite: 326]
                    .map(item => ({
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url [cite: 326, 327]
                    }));

                allEntries.push(...fetchedEntries); [cite: 328]
                pageToken = data.nextPageToken; [cite: 328]
                
                if (allEntries.length >= MAX_RESULTS || !pageToken) break; [cite: 328]

            } catch (err) {
                console.error("Network Error:", err); [cite: 329]
                break; [cite: 330]
            }
        }
        
        return allEntries; [cite: 331]
    }
    
    /**
     * @private
     * @description 단일 영상 ID를 사용하여 정보를 가져오고 유효성을 검사합니다.
     * @param {string} videoId - YouTube 영상 ID
     * @returns {Promise<Array<object>>} - 유효한 Entry 객체가 담긴 배열 (또는 빈 배열)
     */
    async #fetchVideoItem(videoId) {
        if (!await this.#validateVideo(videoId)) { [cite: 332]
            pushSnackbar({ message: "사용할 수 없는 동영상입니다.", type: "error" }); [cite: 332]
            return []; [cite: 333]
        }
        
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.#apiKey}`); [cite: 333]
        const data = await res.json(); [cite: 334]
        const video = data.items[0]; [cite: 334]

        if (!video) return []; [cite: 334]

        return [{
            id: video.id,
            title: video.snippet.title,
            img: video.snippet.thumbnails.medium?.url ||
            video.snippet.thumbnails.default?.url [cite: 335, 336]
        }];
    }
}


/**
 * @class UIManager
 * @description UI 생성 및 업데이트 사용자 상호작용 관련 로직을 처리합니다.
 */
class UIManager {
    // --- Public Properties ---
    /** @type {Dynamic} - 현재 재생 목록의 타이틀 라벨 */
    TitleLabel = Dynamic.$("b"); [cite: 337]

    /** @type {Dynamic} - 저장된 재생 목록들을 표시하는 리스트 */
    PlayLists = Dynamic.$("ul"); [cite: 338]

    /** @type {Dynamic} - 현재 활성화된 재생 목록의 영상들을 표시하는 리스트 */
    EntryLists = Dynamic.$("ul", { style: "display: none;" }); [cite: 339]

    /** @type {Dynamic} - 현재 재생 상태(n / m)를 표시하는 엘리먼트 */
    EntryState = Dynamic.$("li", { class: "entry-status", style: "padding: 4px 8px; font-weight: bold; color: #999;" }); [cite: 340]

    /** @type {Dynamic} - 목록 상단의 헤더 */
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" }); [cite: 341]

    /** @type {Dynamic} - 목록 아이템들을 감싸는 컨테이너 */
    listItemsContainer = Dynamic.$("div", { class: "ytv-list-inner" }); [cite: 342]

    /** @type {boolean} - 사이드 패널의 가시성 상태 */
    PanelVisible = true; [cite: 343]

    // --- Public Methods ---
    /**
     * @param {YouTubeAPIService} apiService - YouTubeAPIService 인스턴스
     */
    constructor(apiService) {
        this.#apiService = apiService; [cite: 344]
    }

    /**
     * @description PlayerService 인스턴스를 설정하여 순환 참조를 해결합니다.
     * @param {PlayerService} playerService - 주입할 PlayerService 인스턴스
     */
    setPlayerService(playerService) {
        this.#playerService = playerService; [cite: 346]
    }

    /**
     * @description 플레이어의 기본 레이아웃을 초기화하고 DOM에 렌더링합니다.
     */
    initializeBaseLayout() {
        this.ListHeader.reset(
            Dynamic.$("a", { href: "#", onclick: e => this.#togglePlaylistView(e) }).add( [cite: 348]
                Dynamic.$("img", { src: "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s88-c-k-c0x00ffffff-no-rj" }),
                Dynamic.$("span", { class: "playlist-title-label" }).add(
                    this.TitleLabel,
                    Dynamic.$("div", { class: "ytv-arrow-triangle", text: "▼" }) [cite: 349]
                )
            )
        );

        this.listItemsContainer.add(this.PlayLists, this.EntryLists); [cite: 350]
        Dynamic.snipe(".ytv-list").reset(this.ListHeader, this.listItemsContainer); [cite: 350]
        Dynamic.snipe(".ytv-panel-toggle-btn").set({ onclick: e => this.togglePanel(e) }); [cite: 350]
    }

    /**
     * @description 사이드 패널 전체를 토글(표시/숨김)합니다.
     * @param {Event} e - 클릭 이벤트 객체
     */
    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible; [cite: 352]

        const list = document.querySelector('.ytv-list'); [cite: 353]
        list.style.width = this.PanelVisible ? "" : "0";
        list.style.height = this.PanelVisible ? "" : "0";
        e.target.classList.toggle("ytv-list-open", this.PanelVisible); [cite: 353]
    }

    /**
     * @description UI의 '현재 재생 중' 정보를 업데이트합니다. (타이틀 상태 텍스트 활성 항목 강조)
     * @param {object} entry - 현재 영상의 Entry 객체
     * @param {number} index - 현재 영상의 인덱스
     * @param {number} total - 전체 영상의 수
     */
    updateNowPlaying(entry, index, total) {
        this.TitleLabel.set({ text: entry.title }); [cite: 355]
        this.EntryState.set({ text: `${index + 1} / ${total}` }); [cite: 356]

        const activeNode = this.EntryLists.node.querySelector(".active"); [cite: 356]
        if (activeNode) activeNode.classList.remove("active"); [cite: 356]
        
        const items = this.EntryLists.node.querySelectorAll(".entry-item"); [cite: 356]
        if (items[index]) {
            items[index].classList.add("active"); [cite: 357]
        }
    }

    /**
     * @description `DataResource`에서 데이터를 읽어와 저장된 재생 목록 UI를 구성합니다.
     */
    buildPlaylistList() {
        const playlistMap = DataResource.Data.basic.playlist; [cite: 359]
        this.PlayLists.reset(); [cite: 359]

        this.PlayLists.add(
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-main-title", style: "width: 100%; margin-bottom: 8px;", placeholder: "큰 타이틀" })), [cite: 360]
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-playlist-url", style: "width: 100%; margin-bottom: 8px;", placeholder: "YouTube URL" })),
            Dynamic.$("li").add(Dynamic.$("button", { text: "➕ 추가", id: "input-playlist-button", onclick: () => this.#addPlaylist() })) [cite: 360]
        );

        Object.keys(playlistMap).sort().forEach(title => { [cite: 361]
            this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));
            Object.entries(playlistMap[title]).sort().forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(title, name, url)) );
        });
    }

    /**
     * @description 주어진 영상 목록(entries)으로 현재 영상 목록 UI를 구성합니다.
     * @param {Array<object>} entries - 표시할 영상 Entry 객체 배열
     */
    buildEntryList(entries) {
        this.EntryLists.reset(); [cite: 363]

        if (entries.length > 1) { [cite: 364]
            this.EntryLists.add(
                this.#createControlButton("🔄", "새로고침", () => Dynamic.FragMutation.refresh()),
                this.#createControlButton("🔀", "재생목록 섞기", () => this.#playerService?.shuffleEntries()),
                this.#createControlButton("↩️", "역순으로 재배치", () => this.#playerService?.reverseEntries()),
                this.#createControlButton("🎯", "재생할 영상 선택", () => this.#playerService?.filterEntries())
            );
        }

        this.EntryLists.add(this.EntryState); [cite: 366]
        entries.forEach((entry, i) => {
            this.EntryLists.add(
                Dynamic.$("li", { class: "entry-item", onclick: () => this.#playerService?.playVideoAt(i) }).add( [cite: 366]
                    Dynamic.$("b", { text: i + 1 }),
                    Dynamic.$("img", { src: entry.img }),
                    Dynamic.$("span", { text: entry.title }) [cite: 367]
                )
            );
        });

        this.ListHeader.node.classList.add("ytv-playlist-open"); [cite: 368]
        this.PlayLists.set({ style: "display: none" }); [cite: 368]
        this.EntryLists.set({ style: "" }); [cite: 368]
    }

    // --- Private Properties ---
    /** @private @type {PlayerService|null} */
    #playerService = null; [cite: 369]

    /** @private @type {YouTubeAPIService} */
    #apiService; [cite: 370]
    /** @private @type {Boolean} */
    #isFetching = false; [cite: 370]

    // --- Private Methods ---
    /**
     * @private
     * @description 저장된 재생목록 뷰와 현재 영상 목록 뷰를 전환합니다.
     * @param {Event} e - 클릭 이벤트 객체
     */
    #togglePlaylistView(e) {
        e.preventDefault(); [cite: 372]

        const showEntries = this.ListHeader.node.classList.toggle("ytv-playlist-open"); [cite: 373]
        this.PlayLists.set({ style: showEntries ? "display: none" : "" }); [cite: 373]
        this.EntryLists.set({ style: showEntries ? "" : "display: none" }); [cite: 374]
    }
    
    /**
     * @private
     * @description '추가' 버튼 클릭 시 입력된 정보로 새 재생목록을 저장합니다.
     */
    #addPlaylist() {
        const titleInput = document.getElementById("input-main-title"); [cite: 375]
        const urlInput = document.getElementById("input-playlist-url"); [cite: 376]
        const title = titleInput.value.trim(); [cite: 376]
        const url = urlInput.value.trim(); [cite: 376]

        if (!title || !url) { [cite: 377]
            pushSnackbar({ message: "모든 입력란을 채워주세요.", type: "error" }); [cite: 377]
            return; [cite: 378]
        }

        const playlistMap = DataResource.Data.basic.playlist; [cite: 378]
        if (!playlistMap[title]) playlistMap[title] = {}; [cite: 378]

        playlistMap[title][url] = url; [cite: 379]

        DataResource.Data.updateData("playlist", playlistMap); [cite: 379]
        DataResource.Data.synchronize(); [cite: 379]
        Dynamic.FragMutation.refresh(); [cite: 379]
    }

    /**
     * @private
     * @description 저장된 재생목록의 개별 항목 UI를 생성합니다.
     * @param {string} title - 재생목록의 대분류 타이틀
     * @param {string} name - 재생목록의 이름(소분류)
     * @param {string} url - 재생목록의 YouTube URL
     * @returns {Dynamic} - 생성된 `<li>` Dynamic 객체
     */
    #createPlaylistItem(title, name, url) {
        return Dynamic.$("li", { class: "playlist-item" }).add( [cite: 380]
            Dynamic.$("a", { href: url, text: name, onclick: async e => {
                e.preventDefault(); [cite: 381]
                if (!this.#playerService || this.#isFetching) return; [cite: 381]
                this.#isFetching = true; [cite: 381]
                
                pushSnackbar({ message: `'${name}' 목록을 불러오는 중...`, type: "normal" }) [cite: 381]
                
                try {
                    const entries = await this.#apiService.fetchEntriesFromURL(url); [cite: 382]
                    
                    if (entries && entries.length > 0) { [cite: 382]
                        this.#playerService.loadNewPlaylist(entries); [cite: 383]
                        pushSnackbar({ message: "재생목록 로드 완료!", type: "normal" }); [cite: 383]
                    } else pushSnackbar({ message: "재생 가능한 영상이 없거나 로드에 실패했습니다.", type: "error" }); [cite: 383]
                } catch (err) {
                    console.error(err); [cite: 384]
                    pushSnackbar({ message: "알 수 없는 오류가 발생했습니다.", type: "error" }); [cite: 385]
                } finally {
                    this.#isFetching = false; [cite: 386]
                }
            }}),
            Dynamic.$("span", { class: "playlist-buttons" }).add( [cite: 387]
                Dynamic.$("button", { class: "playerButton", text: "✏️", onclick: e => this.#editPlaylistName(e, title, name) }),
                Dynamic.$("button", { class: "playerButton", text: "❌", onclick: e => this.#deletePlaylist(e, title, name) })
            )
        );
    }

    /**
     * @private
     * @description 재생목록 이름 수정을 처리합니다.
     * @param {Event} e - 클릭 이벤트
     * @param {string} title - 대분류 타이틀
     * @param {string} oldName - 이전 이름
     */
    #editPlaylistName(e, title, oldName) {
        e.stopPropagation(); [cite: 389]

        const newName = prompt("새 이름을 입력하세요", oldName); [cite: 390]
        if (!newName || newName === oldName) return; [cite: 390]

        const playlistMap = DataResource.Data.basic.playlist; [cite: 390]

        if (playlistMap[title][newName]) { [cite: 391]
            pushSnackbar({ message: "해당 이름은 이미 존재합니다.", type: "error" }); [cite: 391]
            return; [cite: 392]
        }
        playlistMap[title][newName] = playlistMap[title][oldName]; [cite: 392]
        delete playlistMap[title][oldName]; [cite: 392]

        DataResource.Data.updateData("playlist", playlistMap); [cite: 392]
        DataResource.Data.synchronize(); [cite: 392]
        Dynamic.FragMutation.refresh(); [cite: 392]
    }

    /**
     * @private
     * @description 재생목록 삭제를 처리합니다.
     * @param {Event} e - 클릭 이벤트
     * @param {string} title - 대분류 타이틀
     * @param {string} name - 삭제할 재생목록 이름
     */
    #deletePlaylist(e, title, name) {
        e.stopPropagation(); [cite: 394]

        if (!confirm("정말로 삭제하시겠습니까?")) return; [cite: 395]
        
        const playlistMap = DataResource.Data.basic.playlist; [cite: 395]
        delete playlistMap[title][name]; [cite: 395]
        if (Object.keys(playlistMap[title]).length === 0) delete playlistMap[title]; [cite: 395]

        DataResource.Data.updateData("playlist", playlistMap); [cite: 395]
        DataResource.Data.synchronize(); [cite: 395]
        Dynamic.FragMutation.refresh(); [cite: 395]
    }
    
    /**
     * @private
     * @description 영상 목록 상단의 컨트롤 버튼을 생성하는 헬퍼 함수입니다.
     * @param {string} icon - 버튼에 표시될 아이콘
     * @param {string} title - 버튼의 툴팁(title 속성)
     * @param {Function} onClick - 버튼 클릭 시 실행될 콜백 함수
     * @returns {Dynamic} - 생성된 `<button>` Dynamic 객체
     */
    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", text: icon, title, onclick: onClick }); [cite: 397]
    }
}

/**
 * @class PlayerService
 * @description YouTube 플레이어 인스턴스 상태 및 핵심 제어 로직을 관리합니다.
 */
class PlayerService {
    // --- Public Methods ---
    /**
     * @param {UIManager} uiManager - UIManager 인스턴스
     */
    constructor(uiManager) {
        this.#uiManager = uiManager; [cite: 399]
        this.#initKeepAliveAudio(); [cite: 400]
    }

    /**
     * @description 서비스의 모든 UI와 플레이어를 새로고침합니다.
     */
    refreshAll() {
        this.#uiManager.initializeBaseLayout(); [cite: 401]
        this.#uiManager.buildPlaylistList(); [cite: 401]
        this.initializePlayer(); [cite: 401]
    }

    /**
     * @description YouTube 플레이어 인스턴스를 초기화합니다.
     */
    initializePlayer() {
        if (this.#YTPlayer) { [cite: 404]
            this.#YTPlayer.destroy(); [cite: 404]
            this.#YTPlayer = null; [cite: 404]
        }

        if (!YConfig.entries || YConfig.entries.length === 0) return; [cite: 405]

        let playerContainer = document.getElementById("ytv-player"); [cite: 405]
        if (!playerContainer) { [cite: 406]
            playerContainer = document.createElement("div"); [cite: 406]
            playerContainer.id = "ytv-player"; [cite: 406]
            playerContainer.className = "ytv-video"; [cite: 407]
            
            const dynamicPlayer = document.getElementById("dynamic_player"); [cite: 407]
            if (dynamicPlayer) { [cite: 407]
                dynamicPlayer.insertBefore(playerContainer, dynamicPlayer.firstChild); [cite: 407]
            }
        }

        const initialVideoId = YConfig.currentEntry ?
        YConfig.currentEntry.id : YConfig.entries[0].id; [cite: 408, 409]

        this.#YTPlayer = new YT.Player("ytv-player", {
            host: 'https://www.youtube.com',
            origin: window.location.origin,
            videoId: initialVideoId,
            playerVars: {
                "enablejsapi": 1,
                "origin": window.location.origin,
                "playsinline": 1, [cite: 410]
                "rel": 0
            },
            events: { 
                "onReady": () => this.#onPlayerReady(), [cite: 410]
                "onStateChange": e => this.#onPlayerStateChange(e), [cite: 410]
                "onError": e => this.#onPlayerError(e) [cite: 411]
            }
        });
    }

    /**
     * @description `YConfig`의 영상 목록을 플레이어에 네이티브 재생목록으로 로드합니다.
     */
    loadPlaylist() {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== 'function') return; [cite: 413]
        if (!YConfig.entries.length) return; [cite: 414]
        
        let playIndex = YConfig.currentEntry ? YConfig.entries.findIndex(e => e.id === YConfig.currentEntry.id) : -1; [cite: 414]

        if (playIndex === -1) { [cite: 415]
            playIndex = 0; [cite: 415]
            YConfig.currentEntry = YConfig.entries[0] || null; [cite: 416]
        }
        YConfig.lastIdx = playIndex; [cite: 416]

        const videoIds = YConfig.entries.map(entry => entry.id); [cite: 417]
        
        this.#YTPlayer.loadPlaylist({
            playlist: videoIds,
            index: playIndex,
        }); [cite: 417]

        this.#uiManager.buildEntryList(YConfig.entries); [cite: 418]
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, playIndex, YConfig.entries.length); [cite: 418]
    }
    
    /**
     * @description 새로운 영상 목록으로 교체하고 플레이어를 처음부터 다시 로드합니다.
     * @param {Array<object>} entries - 새로운 영상 Entry 객체 배열
     */
    loadNewPlaylist(entries) {
        YConfig.entries = entries; [cite: 419]
        YConfig.currentEntry = entries[0] || null; [cite: 420]
        this.initializePlayer(); [cite: 420]
    }
    
    /**
     * @description 지정된 인덱스의 영상을 재생합니다.
     * @param {number} index - 재생할 영상의 인덱스
     */
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return; [cite: 421]

        YConfig.currentEntry = YConfig.entries[index]; [cite: 422]
        YConfig.lastIdx = index; [cite: 422]

        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length); [cite: 422]
        
        this.#YTPlayer.playVideoAt(index); [cite: 422]
    }
    
    /**
     * @description 현재 영상 목록을 무작위로 섞고 플레이어를 다시 로드합니다.
     */
    shuffleEntries() {
        YConfig.entries.sort(() => Math.random() - 0.5); [cite: 424]
        this.loadPlaylist(); [cite: 424]
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" }); [cite: 425]
    }

    /**
     * @description 현재 영상 목록을 역순으로 뒤집고 플레이어를 다시 로드합니다.
     */
    reverseEntries() {
        YConfig.entries.reverse(); [cite: 426]
        this.loadPlaylist(); [cite: 426]
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" }); [cite: 427]
    }

    /**
     * @private
     * @description 특정 인덱스로 목록을 필터링하고 플레이어를 다시 로드합니다.
     */
    filterEntries() {
        const input = prompt(
            "재생할 영상 번호를 입력해 주세요 (띄어쓰기로 구분)\n\n" + [cite: 428]
            "• 단일 번호 : 3 8 12\n" +
            "• 범위 입력 : 3-10 또는 3~10 (3~10번)\n" +
            "• 처음부터 : -5 또는 ~5 (1~5번)\n" +
            "• 끝까지   : 7- 또는 7~ (7~N번)\n\n" + [cite: 429]
            "※ 단일 번호와 범위를 섞어 입력할 수 있습니다 (예: 2 5-9 11~)\n" +
            "※ '-' 또는 '~'는 숫자와 붙여 써야 하며 번호는 현재 재생중인 목록을 따릅니다."
        );

        if (!input) return; [cite: 430]
    
        const indices = new Set(); [cite: 430]
        const tokens = input.trim().split(/\s+/); [cite: 430]
        const maxIndex = YConfig.entries.length; [cite: 430]

        for (const token of tokens) {
            if (/^\d+$/.test(token)) indices.add(Number(token)); [cite: 431]
            else if (/^(\d+)[-~](\d+)$/.test(token)) { [cite: 432]
                let [ a, b ] = token.match(/^(\d+)[-~](\d+)$/).slice(1).map(Number); [cite: 432]
                for (let i = Math.min(a, b); i <= Math.max(a, b); i++) indices.add(i); [cite: 433]
            } else if (/^[-~](\d+)$/.test(token)) { [cite: 434]
                const end = Number(token.match(/^[-~](\d+)$/)[1]); [cite: 434]
                for (let i = 1; i <= end; i++) indices.add(i); [cite: 435]
            } else if (/^(\d+)[-~]$/.test(token)) { [cite: 436]
                const start = Number(token.match(/^(\d+)[-~]$/)[1]); [cite: 436]
                for (let i = start; i <= maxIndex; i++) indices.add(i); [cite: 437]
            }
        }
    
        const parsed = [...indices].map(n => YConfig.entries[n - 1]).filter(Boolean); [cite: 438]

        if (!parsed.length) { [cite: 439]
            pushSnackbar({ message: "선택이 잘못되었습니다.", type: "error" }); [cite: 439]
            return; [cite: 440]
        }
        
        YConfig.entries = parsed; [cite: 440]
        this.loadPlaylist(); [cite: 441]
        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" }); [cite: 441]
    }

    // --- Private Properties ---
    /** @private @type {YT.Player|null} - YouTube IFrame Player API의 플레이어 인스턴스 */
    #YTPlayer = null; [cite: 442]

    /** @private @type {UIManager} - UI 관리를 위한 UIManager 인스턴스 */
    #uiManager; [cite: 444]

    /** @private @type {HTMLAudioElement|null} - 백그라운드 재생 유지를 위한 더미 오디오 */
    #keepAliveAudio = null; [cite: 445]

    // --- Private Methods ---
    /**
     * @private
     * @description 브라우저 탭 절전 방지를 위한 더미 오디오를 초기화합니다.
     */
    #initKeepAliveAudio() {
        this.#keepAliveAudio = new Audio(); [cite: 447]
        this.#keepAliveAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; [cite: 447]
        this.#keepAliveAudio.loop = true; [cite: 448]
        this.#keepAliveAudio.volume = 0; [cite: 448]
    }

    /**
     * @private
     * @description 플레이어 로드(`onStateChange`) 이벤트를 처리합니다.
     */
    #onPlayerReady() {
        if (YConfig.entries.length > 0) this.loadPlaylist(); [cite: 449]
        this.#uiManager.buildEntryList(YConfig.entries); [cite: 449]
    }

    /**
     * @private
     * @description 플레이어 상태 변경(`onStateChange`) 이벤트를 처리합니다.
     * @param {object} event - YouTube 플레이어 이벤트 객체
     */
    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) { [cite: 451]
            if (this.#keepAliveAudio) { [cite: 451]
                this.#keepAliveAudio.play().catch(() => {}); [cite: 451]
            }
            
            if ('mediaSession' in navigator) { [cite: 452]
                navigator.mediaSession.playbackState = 'playing'; [cite: 452]
            }

            const nativeIndex = this.#YTPlayer.getPlaylistIndex(); [cite: 453]
            const isValid = nativeIndex >= 0; [cite: 454]
            const isChanged = nativeIndex !== YConfig.lastIdx; [cite: 454]
            
            if (isValid && isChanged) { [cite: 455]
                YConfig.lastIdx = nativeIndex; [cite: 455]
                YConfig.currentEntry = YConfig.entries[nativeIndex]; [cite: 456]
                
                const totalLength = YConfig.entries.length; [cite: 456]
                this.#uiManager.updateNowPlaying(YConfig.currentEntry, nativeIndex, totalLength); [cite: 456]
            }
        } 
        else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) { [cite: 457]
            if (this.#keepAliveAudio) { [cite: 457]
                this.#keepAliveAudio.pause(); [cite: 457]
            }
            
            if ('mediaSession' in navigator) { [cite: 458]
                navigator.mediaSession.playbackState = 'paused'; [cite: 458]
            }

            // 중지(PAUSED) 및 종료(ENDED) 시점에만 로컬 스토리지에 동기화하여 불필요한 부하를 방지합니다.
            localStorage.setItem("YConfig", JSON.stringify(YConfig)); [cite: 459]
        }
    }

    /**
     * @private
     * @description 플레이어 에러 발생 시 자동으로 다음 곡으로 건너뜁니다.
     * @param {object} event - YouTube 플레이어 이벤트 객체
     */
    #onPlayerError(event) {
        const errorCode = event.data; [cite: 461]
        const errorMsg = { [cite: 462]
            2: "유효하지 않은 파라미터입니다.",
            5: "HTML5 플레이어 오류입니다.",
            100: "영상을 찾을 수 없거나 비공개 동영상입니다.",
            101: "이 영상은 퍼가기가 차단되었습니다.",
            150: "이 영상은 퍼가기가 차단되었습니다."
        }[errorCode] || "알 수 없는 오류입니다."; [cite: 463]
        
        console.warn(`Playback Error (${errorCode}): ${errorMsg} - Skipping to next track.`); [cite: 463]

        if (YConfig.entries.length > 1) { [cite: 464]
            const safeIndex = YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0; [cite: 464, 465]
            const nextIndex = (safeIndex + 1) % YConfig.entries.length; [cite: 465]
            
            setTimeout(() => this.playVideoAt(nextIndex), 100); [cite: 465]
        } else pushSnackbar({ message: "재생할 수 있는 영상이 없습니다.", type: "error" }); [cite: 466]
    }
}

// --- 전역 인스턴스 및 내보내기 ---
/** * @type {PlayerService | null} 
 * @description 현재 활성화된 PlayerService의 유일한 인스턴스 
 */
let activePlayerService = null; [cite: 468]

/**
 * @type {savedPlayerInstance: object}
 * @description 저장된 플레이어 설정(YConfig)을 복원합니다.
 */
const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance; [cite: 469]

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add( [cite: 470]
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    // 서비스 인스턴스가 없으면 최초 1회만 생성
    if (!activePlayerService) { [cite: 470, 471]
        // --- 서비스 인스턴스 생성 및 의존성 주입 ---
        const apiService = new YouTubeAPIService(); [cite: 471]
        const uiManager = new UIManager(apiService); [cite: 471]

        activePlayerService = new PlayerService(uiManager); [cite: 471]
        uiManager.setPlayerService(activePlayerService); [cite: 471]
    }

    // 최초 로드 및 새로고침 시 항상 전체 리프레시를 담당하는 메서드 호출
    activePlayerService.refreshAll(); [cite: 471]
});

export { restoreYConfig }; [cite: 472]
export default Player; [cite: 472]
