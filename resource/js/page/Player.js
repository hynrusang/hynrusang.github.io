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
 * @description YouTube Data API v3 관련 로직을 처리합니다. (영상 정보 가져오기, 유효성 검사 등)
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

        while (allEntries.length < MAX_RESULTS) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.#apiKey}&part=snippet&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`;
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data.items) break;

            const fetchedEntries = data.items
                .filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
                .map(item => ({
                    id: item.snippet.resourceId.videoId,
                    title: item.snippet.title,
                    img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
                }));
            
            allEntries.push(...fetchedEntries);

            if (!data.nextPageToken || allEntries.length >= MAX_RESULTS) break;
            pageToken = data.nextPageToken;
        }
        
        const allVideoIds = allEntries.map(entry => entry.id);
        const validVideoIds = new Set();
        
        for (let i = 0; i < allVideoIds.length; i += 50) {
            const chunk = allVideoIds.slice(i, i + 50);
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id,status&id=${chunk.join(',')}&key=${this.#apiKey}&fields=items(id,status/embeddable)`);
            const data = await res.json();
            if (data.items) data.items.forEach(item => { if (item.status?.embeddable) validVideoIds.add(item.id); });
        }
        
        const validEntries = allEntries.filter(entry => validVideoIds.has(entry.id));
        
        const invalidCount = allEntries.length - validEntries.length;
        if (invalidCount > 0) pushSnackbar({ message: `사용할 수 없는 동영상 ${invalidCount}개를 제외했습니다.`, type: "normal" });

        return validEntries;
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
            img: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url
        }];
    }
}


/**
 * @class UIManager
 * @description UI 생성 및 업데이트, 사용자 상호작용 관련 로직을 처리합니다.
 */
class UIManager {
    // --- Public Properties ---
    /** @type {Dynamic} - 현재 재생 목록의 타이틀 라벨 */
    TitleLabel = Dynamic.$("b");
    /** @type {Dynamic} - 저장된 재생 목록들을 표시하는 리스트 */
    PlayLists = Dynamic.$("ul");
    /** @type {Dynamic} - 현재 활성화된 재생 목록의 영상들을 표시하는 리스트 */
    EntryLists = Dynamic.$("ul", { style: "display: none;" });
    /** @type {Dynamic} - 현재 재생 상태(n / m)를 표시하는 엘리먼트 */
    EntryState = Dynamic.$("li", { class: "entry-status", style: "padding: 4px 8px; font-weight: bold; color: #999;" });
    /** @type {Dynamic} - 목록 상단의 헤더 */
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" });
    /** @type {Dynamic} - 목록 아이템들을 감싸는 컨테이너 */
    listItemsContainer = Dynamic.$("div", { class: "ytv-list-inner" });
    /** @type {boolean} - 사이드 패널의 가시성 상태 */
    PanelVisible = true;

    // --- Public Methods ---
    /**
     * @param {YouTubeAPIService} apiService - YouTubeAPIService 인스턴스
     */
    constructor(apiService) {
        this.#apiService = apiService;
    }

    /**
     * @description PlayerService 인스턴스를 설정하여 순환 참조를 해결합니다.
     * @param {PlayerService} playerService - 주입할 PlayerService 인스턴스
     */
    setPlayerService(playerService) {
        this.#playerService = playerService;
    }

    /**
     * @description 플레이어의 기본 레이아웃을 초기화하고 DOM에 렌더링합니다.
     */
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

    /**
     * @description 사이드 패널 전체를 토글(표시/숨김)합니다.
     * @param {Event} e - 클릭 이벤트 객체
     */
    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible;
        const list = document.querySelector('.ytv-list');
        list.style.width = this.PanelVisible ? "" : "0";
        list.style.height = this.PanelVisible ? "" : "0";
        e.target.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    /**
     * @description UI의 '현재 재생 중' 정보를 업데이트합니다. (타이틀, 상태 텍스트, 활성 항목 강조)
     * @param {object} entry - 현재 영상의 Entry 객체
     * @param {number} index - 현재 영상의 인덱스
     * @param {number} total - 전체 영상의 수
     */
    updateNowPlaying(entry, index, total) {
        this.TitleLabel.set({ text: entry.title });
        this.EntryState.set({ text: `${index + 1} / ${total}` });

        const entryItems = this.EntryLists.node.querySelectorAll(".entry-item");
        if (YConfig.lastIdx >= 0) entryItems[YConfig.lastIdx]?.classList.remove("active");
        entryItems[index]?.classList.add("active");
    }

    /**
     * @description `DataResource`에서 데이터를 읽어와 저장된 재생 목록 UI를 구성합니다.
     */
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

    /**
     * @description 주어진 영상 목록(entries)으로 현재 영상 목록 UI를 구성합니다.
     * @param {Array<object>} entries - 표시할 영상 Entry 객체 배열
     */
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
    /** @private @type {PlayerService|null} */
    #playerService = null;
    /** @private @type {YouTubeAPIService} */
    #apiService;

    // --- Private Methods ---
    /**
     * @private
     * @description 저장된 재생목록 뷰와 현재 영상 목록 뷰를 전환합니다.
     * @param {Event} e - 클릭 이벤트 객체
     */
    #togglePlaylistView(e) {
        e.preventDefault();
        const showEntries = this.ListHeader.node.classList.toggle("ytv-playlist-open");
        this.PlayLists.set({ style: showEntries ? "display: none" : "" });
        this.EntryLists.set({ style: showEntries ? "" : "display: none" });
    }
    
    /**
     * @private
     * @description '추가' 버튼 클릭 시, 입력된 정보로 새 재생목록을 저장합니다.
     */
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

    /**
     * @private
     * @description 저장된 재생목록의 개별 항목 UI를 생성합니다.
     * @param {string} title - 재생목록의 대분류 타이틀
     * @param {string} name - 재생목록의 이름(소분류)
     * @param {string} url - 재생목록의 YouTube URL
     * @returns {Dynamic} - 생성된 `<li>` Dynamic 객체
     */
    #createPlaylistItem(title, name, url) {
        return Dynamic.$("li", { class: "playlist-item" }).add(
            Dynamic.$("a", { href: url, onclick: async e => {
                e.preventDefault();
                if (!this.#playerService) return;

                const entries = await this.#apiService.fetchEntriesFromURL(url);
                if (entries.length > 0) this.#playerService.loadNewPlaylist(entries);
            }}).add(
                Dynamic.$("span", { class: "playlist-name", text: name }),
                Dynamic.$("span", { class: "playlist-buttons" }).add(
                    Dynamic.$("button", { class: "playerButton", text: "✏️", onclick: e => this.#editPlaylistName(e, title, name) }),
                    Dynamic.$("button", { class: "playerButton", text: "❌", onclick: e => this.#deletePlaylist(e, title, name) })
                )
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

    /**
     * @private
     * @description 재생목록 삭제를 처리합니다.
     * @param {Event} e - 클릭 이벤트
     * @param {string} title - 대분류 타이틀
     * @param {string} name - 삭제할 재생목록 이름
     */
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
    
    /**
     * @private
     * @description 영상 목록 상단의 컨트롤 버튼을 생성하는 헬퍼 함수입니다.
     * @param {string} icon - 버튼에 표시될 아이콘
     * @param {string} title - 버튼의 툴팁(title 속성)
     * @param {Function} onClick - 버튼 클릭 시 실행될 콜백 함수
     * @returns {Dynamic} - 생성된 `<button>` Dynamic 객체
     */
    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", text: icon, title, onclick: onClick });
    }
}

/**
 * @class PlayerService
 * @description YouTube 플레이어 인스턴스, 상태 및 핵심 제어 로직을 관리합니다.
 */
class PlayerService {
    // --- Public Methods ---
    /**
     * @param {UIManager} uiManager - UIManager 인스턴스
     */
    constructor(uiManager) {
        this.#uiManager = uiManager;
    }

    /**
     * @description 서비스의 모든 UI와 플레이어를 새로고침합니다.
     */
    refreshAll() {
        this.#uiManager.initializeBaseLayout();
        this.#uiManager.buildPlaylistList();
        this.initializePlayer();
    }

    /**
     * @description YouTube 플레이어 인스턴스를 초기화합니다.
     */
    initializePlayer() {
        if (this.#YTPlayer) this.#YTPlayer.destroy();
        this.#YTPlayer = new YT.Player("ytv-player", { 
            playerVars: {
                "enablejsapi": 1,
                'origin': window.location.origin,
                'widget_referrer': window.location.origin
            },
            events: { 
                "onReady": () => this.#onPlayerReady(),
                "onStateChange": e => this.#onPlayerStateChange(e),
                "onError": e => this.#onPlayerError(e)
            }
        });
    }

    /**
     * @description `YConfig`의 영상 목록을 플레이어에 로드합니다. 시청 기록을 최대한 보존합니다.
     */
    loadPlaylist() {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== 'function') return;
        if (!YConfig.entries.length) return;

        const playlist = YConfig.entries.map(entry => entry.id);
        let playIndex = YConfig.currentEntry ? playlist.indexOf(YConfig.currentEntry.id) : -1;

        if (playIndex === -1) {
            playIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
        }
        
        YConfig.lastIdx = -1;
        this.#YTPlayer.loadPlaylist(playlist, playIndex);
        this.#YTPlayer.setLoop(true);
        this.#uiManager.buildEntryList(YConfig.entries);
    }
    
    /**
     * @description 새로운 영상 목록으로 교체하고 플레이어를 처음부터 다시 로드합니다. (사용자가 새 재생목록 선택 시)
     * @param {Array<object>} entries - 새로운 영상 Entry 객체 배열
     */
    loadNewPlaylist(entries) {
        YConfig.entries = entries;
        YConfig.currentEntry = entries[0] || null;
        this.initializePlayer();
    }
    
    /**
     * @description 지정된 인덱스의 영상을 재생합니다.
     * @param {number} index - 재생할 영상의 인덱스
     */
    playVideoAt(index) {
        this.#YTPlayer.playVideoAt(index);
    }
    
    /**
     * @description 현재 영상 목록을 무작위로 섞고 플레이어를 다시 로드합니다. (시청 기록 보존)
     */
    shuffleEntries() {
        YConfig.entries.sort(() => Math.random() - 0.5);
        this.loadPlaylist();
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }

    /**
     * @description 현재 영상 목록을 역순으로 뒤집고 플레이어를 다시 로드합니다. (시청 기록 보존)
     */
    reverseEntries() {
        YConfig.entries.reverse();
        this.loadPlaylist();
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }

    /**
     * @private
     * @description 특정 인덱스로 목록을 필터링하고 플레이어를 다시 로드합니다. (시청 기록 보존)
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
                let [ , a, b ] = token.match(/^(\d+)[-~](\d+)$/).map(Number);
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
    /** @private @type {YT.Player|null} - YouTube IFrame Player API의 플레이어 인스턴스 */
    #YTPlayer = null;
    /** @private @type {number|null} - 플레이어 상태 추적을 위한 `setInterval` 타이머 ID */
    #TimeTracker = null;
    /** @private @type {UIManager} - UI 관리를 위한 UIManager 인스턴스 */
    #uiManager;

    // --- Private Methods ---
    /**
     * @private
     * @description 플레이어 로드(`onStateChange`) 이벤트를 처리합니다.
     */
    #onPlayerReady() {
        this.loadPlaylist();
    }

    /**
     * @private
     * @description 플레이어 상태 변경(`onStateChange`) 이벤트를 처리합니다.
     * @param {object} event - YouTube 플레이어 이벤트 객체
     */
    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            const idx = this.#YTPlayer.getPlaylistIndex();
            
            if (0 <= idx && idx !== YConfig.lastIdx) {
                YConfig.currentEntry = YConfig.entries[idx];
                this.#uiManager.updateNowPlaying(YConfig.currentEntry, idx, YConfig.entries.length);
                YConfig.lastIdx = idx;
                localStorage.setItem("YConfig", JSON.stringify(YConfig));
            }
        }
    }

    /**
     * @private
     * @description 플레이어 에러(`onError`) 이벤트를 처리합니다.
     * @param {object} event - YouTube 플레이어 이벤트 객체
     */
    #onPlayerError(event) {
        if (YConfig.entries.length > 1) {
            pushSnackbar({ message: "재생할 수 없는 동영상을 건너뛰었습니다.", type: "error" });
            const currentIndex = event.target.getPlaylistIndex();
            const nextIndex = (currentIndex + 1) % YConfig.entries.length;
            event.target.playVideoAt(nextIndex);
        } else {
            pushSnackbar({ message: "재생할 수 없는 동영상입니다.", type: "error" });
        }
    }
}

// --- 전역 인스턴스 및 내보내기 ---
/** 
 * @type {PlayerService | null} 
 * @description 현재 활성화된 PlayerService의 유일한 인스턴스 
 */
let activePlayerService = null;

/**
 * @type {savedPlayerInstance: object}
 * @description 저장된 플레이어 설정(YConfig)을 복원합니다.
 */
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
    // 서비스 인스턴스가 없으면 최초 1회만 생성
    if (!activePlayerService) {
        // --- 서비스 인스턴스 생성 및 의존성 주입 ---
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);

        activePlayerService = new PlayerService(uiManager);
        uiManager.setPlayerService(activePlayerService);
    }

    // 최초 로드 및 새로고침 시 항상 전체 리프레시를 담당하는 메서드 호출
    activePlayerService.refreshAll();
});

export { restoreYConfig };
export default Player;