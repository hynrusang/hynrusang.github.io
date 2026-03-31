import { Dynamic } from "../init/module.js";
import { pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

// ==========================================
// 1. 초기 설정 및 전역 상태 관리
// ==========================================

/**
 * @description YouTube 플레이어 및 재생목록 데이터의 전반적인 상태를 관리하는 전역 설정 객체입니다.
 * 재생할 영상들의 목록과 현재 재생 중인 위치 정보를 기억하여 로컬 스토리지 동기화 및 UI 업데이트에 활용됩니다.
 * * @property {Array<object>} entries - 현재 재생 대기열에 포함된 모든 영상 정보(ID, 썸네일, 제목) 배열
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
    currentEntry: null,
};

// ==========================================
// 2. 서비스 클래스 정의 (API 통신 및 UI/플레이어 제어)
// ==========================================

/**
 * @class YouTubeAPIService
 * @description YouTube Data API v3를 활용하여 영상 정보를 긁어오고 유효성을 검사하는 백엔드 통신 담당 클래스입니다.
 */
class YouTubeAPIService {
    // --- Public Methods ---
    /**
     * @description 사용자가 입력한 YouTube URL(단일 영상 또는 재생목록)을 분석하여 재생 가능한 영상 목록 데이터로 변환합니다.
     * @param {string} url - 사용자가 입력한 YouTube 영상 또는 재생목록 주소
     * @returns {Promise<Array<object>>} - 파싱 및 검증이 완료된 Entry 객체 배열
     */
    async fetchEntriesFromURL(url) {
        // 정규식을 통해 재생목록 ID 또는 단일 영상 ID를 추출합니다.
        const playlistIdMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        const videoIdMatch = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

        try {
            // 재생목록 주소인 경우 재생목록 페치 메서드 호출
            if (playlistIdMatch) return await this.#fetchPlaylistItems(playlistIdMatch[1]);
            // 단일 영상 주소인 경우 단일 영상 페치 메서드 호출
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
     * @description YouTube Data API v3 호출 시 필요한 인증 키입니다.
     * @type {string}
     */
    #apiKey = "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo";

    // --- Private Methods ---
    /**
     * @private
     * @description oEmbed 엔드포인트를 우회 호출하여 해당 영상 ID가 퍼가기 제한 없이 실제로 재생 가능한지 사전 검증합니다.
     * @param {string} videoId - 유효성을 검사할 YouTube 영상 고유 ID
     * @returns {Promise<boolean>} - 재생 가능 여부 (true/false)
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
     * @description 재생목록 ID를 기반으로 내부의 모든 영상 항목을 순회하며 가져옵니다. (페이징 처리를 통해 최대 200개까지 지원)
     * 비공개 및 삭제된 동영상은 이 단계에서 자동으로 필터링됩니다.
     * @param {string} playlistId - YouTube 공식 재생목록 고유 ID
     * @returns {Promise<Array<object>>} - 검증이 완료된 Entry 객체 배열
     */
    async #fetchPlaylistItems(playlistId) {
        let allEntries = [];
        let pageToken = "";
        const MAX_RESULTS = 200;
        
        while (true) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.#apiKey}&part=snippet&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`;

            try {
                const res = await fetch(apiUrl);
                const data = await res.json();
                
                // API 할당량 초과 및 잘못된 요청 에러 핸들링
                if (data.error) {
                    pushSnackbar({ message: `목록 로드 실패: ${data.error.message}`, type: "error" });
                    break;
                }
                
                if (!data.items) break;

                // 비공개 영상 및 삭제된 영상 필터링 후 렌더링용 객체로 매핑
                const fetchedEntries = data.items
                    .filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
                    .map(item => ({
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
                    }));

                allEntries.push(...fetchedEntries);
                pageToken = data.nextPageToken;
                
                // 최대 개수에 도달하거나 다음 페이지가 없으면 루프 종료
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
     * @description 단일 영상 ID를 기반으로 상세 정보를 가져오고 재생 유효성을 최종 검사합니다.
     * @param {string} videoId - YouTube 영상 고유 ID
     * @returns {Promise<Array<object>>} - 유효성이 확인된 단일 Entry 객체가 담긴 배열
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
 * @description 사용자 인터페이스(UI) 요소 생성 및 클릭 이벤트 등 프론트엔드 상호작용 관련 로직을 독점적으로 처리합니다.
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

    /**
     * @description 플레이어 우측 및 하단의 커스텀 UI 골격을 최초 1회 초기화합니다.
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
     * @description 우측 재생목록 패널의 열림/닫힘 상태를 제어합니다.
     */
    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible;
        const list = document.querySelector('.ytv-list');
        list.style.width = this.PanelVisible ? "" : "0";
        list.style.height = this.PanelVisible ? "" : "0";
        e.target.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    /**
     * @description 현재 재생 중인 영상 정보를 UI(제목 표시줄 및 리스트 강조 표시)에 반영합니다.
     */
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

    /**
     * @description 로컬 저장소에 저장된 대분류 재생목록(플레이리스트 모음) UI를 생성합니다.
     */
    buildPlaylistList() {
        const playlistMap = DataResource.Data.basic.playlist;
        this.PlayLists.reset();

        // 재생목록 추가를 위한 입력란 및 버튼 생성
        this.PlayLists.add(
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-main-title", style: "width: 100%; margin-bottom: 8px;", placeholder: "큰 타이틀" })),
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-playlist-url", style: "width: 100%; margin-bottom: 8px;", placeholder: "YouTube URL" })),
            Dynamic.$("li").add(Dynamic.$("button", { text: "➕ 추가", id: "input-playlist-button", onclick: () => this.#addPlaylist() }))
        );

        // 저장된 플레이리스트 데이터를 순회하며 DOM 요소 렌더링
        Object.keys(playlistMap).sort().forEach(title => {
            this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));
            Object.entries(playlistMap[title]).sort().forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(title, name, url)) );
        });
    }

    /**
     * @description 현재 대기열에 올라온 개별 영상(Entry) 목록을 하단 UI로 생성합니다.
     */
    buildEntryList(entries) {
        this.EntryLists.reset();

        // 셔플 및 필터링 제어 버튼 추가
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
 * @description YouTube 플레이어 인스턴스의 생명주기 제어 및 셔플 등 핵심 재생 로직을 관리합니다.
 */
class PlayerService {
    // --- Public Methods ---
    constructor(uiManager) {
        this.#uiManager = uiManager;
        // 모바일 백그라운드 환경 유지를 위한 가상 오디오 초기화
        this.#initKeepAliveAudio();
    }

    refreshAll() {
        this.#uiManager.initializeBaseLayout();
        this.#uiManager.buildPlaylistList();
        this.initializePlayer();
    }

    /**
     * @description YouTube Iframe API를 기반으로 플레이어 인스턴스를 최초 생성합니다.
     * 메모리 누수를 방지하기 위해 단일 영상으로 iframe을 생성한 직후 onReady 시점에 배열 큐를 네이티브로 적재합니다.
     */
    initializePlayer() {
        // 기존 인스턴스가 존재할 경우 확실하게 파괴하여 메모리 누수를 원천 차단
        if (this.#YTPlayer) {
            this.#YTPlayer.destroy();
            this.#YTPlayer = null;
        }
    
        if (!YConfig.entries || YConfig.entries.length === 0) return;
    
        // 플레이어가 안착할 DOM 요소 생성 및 검증
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
    
        // 로컬 스토리지 데이터에 기반하여 재생을 시작할 인덱스 산출
        let playIndex = YConfig.currentEntry ? YConfig.entries.findIndex(e => e.id === YConfig.currentEntry.id) : -1;
        if (playIndex === -1) {
            playIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
        }
        YConfig.lastIdx = playIndex;
    
        // 오류를 유발하던 playerVars 내부의 playlist 속성을 제거하고 첫 번째 videoId로만 안전하게 렌더링 시작
        this.#YTPlayer = new YT.Player("ytv-player", {
            host: 'https://www.youtube.com',
            videoId: YConfig.entries[playIndex].id,
            playerVars: {
                "enablejsapi": 1,
                "origin": window.location.origin,
                "playsinline": 1,
                "rel": 0
            },
            events: { 
                "onReady": (e) => {
                    // 렌더링이 완료된 직후 postMessage 통신을 통해 전체 배열을 내부 큐 엔진에 적재 (메모리 최적화의 핵심)
                    const idArray = YConfig.entries.map(entry => entry.id);
                    e.target.loadPlaylist(idArray, playIndex);
                    
                    this.#onPlayerReady();
                },
                "onStateChange": e => this.#onPlayerStateChange(e),
                "onError": e => this.#onPlayerError(e)
            }
        });
    }
    
    refreshPlaylistStatus() {
        if (!YConfig.entries.length) return;
        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, YConfig.lastIdx, YConfig.entries.length);
    }
    
    /**
     * @description 새로운 외부 재생목록이 로드되었을 때 플레이어를 초기화합니다.
     */
    loadNewPlaylist(entries) {
        YConfig.entries = entries;
        YConfig.currentEntry = entries[0] || null;
        this.initializePlayer();
    }
    
    /**
     * @description 커스텀 UI에서 특정 영상을 클릭했을 때 해당 인덱스로 점프합니다.
     */
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;
        YConfig.currentEntry = YConfig.entries[index];
        YConfig.lastIdx = index;
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, index, YConfig.entries.length);
        if (this.#YTPlayer && this.#YTPlayer.playVideoAt) {
            this.#YTPlayer.playVideoAt(index);
        }
    }
    
    /**
     * @description 현재 대기열을 무작위로 섞고 현재 재생 흐름이 끊기지 않도록 네이티브 큐를 동기화합니다.
     */
    shuffleEntries() {
        YConfig.entries.sort(() => Math.random() - 0.5);
        this.#syncNativePlaylistWithCurrentState();
        this.refreshPlaylistStatus();
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }

    /**
     * @description 현재 대기열을 역순으로 재배치하고 네이티브 큐를 동기화합니다.
     */
    reverseEntries() {
        YConfig.entries.reverse();
        this.#syncNativePlaylistWithCurrentState();
        this.refreshPlaylistStatus();
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

        // 필터링 후에도 재생 흐름 유지를 위해 네이티브 큐 강제 동기화
        this.#syncNativePlaylistWithCurrentState();
        this.refreshPlaylistStatus();
        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" });
    }

    // --- Private Properties ---
    #YTPlayer = null;
    #uiManager;
    #keepAliveAudio = null;

    // --- Private Methods ---
    /**
     * @private
     * @description 셔플이나 필터링 등으로 자바스크립트 배열 데이터가 변경될 때 호출됩니다.
     * 현재 재생 중이던 영상의 새로운 인덱스 위치와 시청 중이던 시간을 계산하여 유튜브 내부 네이티브 큐를 매끄럽게 갱신합니다.
     */
    #syncNativePlaylistWithCurrentState() {
        if (!this.#YTPlayer || typeof this.#YTPlayer.loadPlaylist !== 'function') return;

        const idArray = YConfig.entries.map(entry => entry.id);
        // 섞인 배열 속에서 현재 영상이 어디로 이동했는지 추적
        let newIndex = YConfig.entries.findIndex(e => e.id === (YConfig.currentEntry ? YConfig.currentEntry.id : null));
        let startSeconds = 0;
        
        if (newIndex !== -1) {
            // 현재 영상의 시청 초수를 캡처
            startSeconds = this.#YTPlayer.getCurrentTime() || 0;
            YConfig.lastIdx = newIndex;
        } else {
            // 필터링으로 인해 현재 영상이 목록에서 사라졌을 경우 처음으로 초기화
            newIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
            YConfig.lastIdx = 0;
        }
        
        const isPlaying = this.#YTPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        
        // 시간과 인덱스를 포함하여 네이티브 큐 덮어쓰기
        this.#YTPlayer.loadPlaylist(idArray, newIndex, startSeconds);
        
        // 정지 상태에서 셔플했을 경우 오토플레이 방지
        if (!isPlaying) {
            setTimeout(() => {
                if (this.#YTPlayer && this.#YTPlayer.getPlayerState() !== YT.PlayerState.PAUSED) {
                    this.#YTPlayer.pauseVideo();
                }
            }, 100);
        }
    }

    /**
     * @private
     * @description 모바일 환경에서 백그라운드 탭 차단을 막기 위해 무음 오디오를 생성하여 생명 주기를 연장합니다.
     */
    #initKeepAliveAudio() {
        this.#keepAliveAudio = new Audio();
        this.#keepAliveAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        this.#keepAliveAudio.loop = true;
        this.#keepAliveAudio.volume = 0;
    }

    #onPlayerReady() {
        if (YConfig.entries.length > 0) this.refreshPlaylistStatus();
        this.#uiManager.buildEntryList(YConfig.entries);
    }

    /**
     * @private
     * @description 유튜브 플레이어의 상태 변화(재생 정지 종료 등) 이벤트를 감지하여 제어 로직을 수행합니다.
     */
    #onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {

            // 백그라운드 환경 보호 장치 가동
            this.#keepAliveAudio?.play().catch(() => {});
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';

            // 자동 재생으로 곡이 넘어간 사실이 확인되었을 때 처리
            const nativeIndex = this.#YTPlayer.getPlaylistIndex();
            if (nativeIndex >= 0 && nativeIndex !== YConfig.lastIdx) {
                YConfig.lastIdx = nativeIndex;
                YConfig.currentEntry = YConfig.entries[nativeIndex];
                this.#uiManager.updateNowPlaying(YConfig.currentEntry, nativeIndex, YConfig.entries.length);

                // 재생 중 상태라도 다음 곡으로 넘어갔다면 로컬 스토리지에 변경된 인덱스를 즉시 강제 저장하여 데이터 유실 원천 차단
                localStorage.setItem("YConfig", JSON.stringify(YConfig));
            }
        } 
        else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {

            // 보호 장치 일시 중지 및 자원 반환
            this.#keepAliveAudio?.pause();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            
            // 기존과 동일하게 명시적 중지 및 종료 시점에도 상태 백업 수행
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
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
            setTimeout(() => this.playVideoAt(nextIndex), 100);
        } else pushSnackbar({ message: "재생할 수 있는 영상이 없습니다.", type: "error" });
    }
}

// ==========================================
// 3. 전역 인스턴스 초기화 및 모듈 내보내기
// ==========================================

let activePlayerService = null;

// 외부 스토리지 복원 함수
const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance;

// Fragment 객체 생성 및 렌더링 후 이벤트 매핑
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {

    // 플레이어 서비스 객체가 없을 때만 최초 초기화 진행 (메모리 중복 할당 방지)
    if (!activePlayerService) {
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);
        activePlayerService = new PlayerService(uiManager);
        uiManager.setPlayerService(activePlayerService);
    }
    
    // 레이아웃 및 플레이어 리프레시 실행
    activePlayerService.refreshAll();
});

export { restoreYConfig };
export default Player;
