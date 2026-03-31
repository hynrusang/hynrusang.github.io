import { Dynamic } from "../init/module.js";
import { pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

// ==========================================
// 1. 초기 설정 및 전역 상태 관리
// ==========================================

/**
 * @description 플레이어 모듈 전체에서 공유하는 전역 재생 상태 객체입니다.
 * 단순히 "현재 재생 중인 영상"만 기억하는 용도가 아니라, 커스텀 UI의 목록 렌더링 상태,
 * 로컬 스토리지 복원 상태, 실제 YouTube 플레이어에 다시 적용해야 할 큐의 형태를 함께 보존합니다.
 *
 * @property {Array<{id:string, img:string, title:string}>} entries
 * 현재 플레이어가 관리하는 재생 대기열입니다. 공식 재생목록을 그대로 불러온 경우에도
 * 실제 UI 렌더링 및 인덱스 계산은 이 배열을 기준으로 수행합니다.
 *
 * @property {number} lastIdx
 * 마지막으로 재생되었거나, 재생 대상으로 확정된 엔트리의 인덱스입니다.
 * 상태 변화 이벤트가 들어왔을 때 현재 위치를 안정적으로 복원하는 기준값으로도 사용합니다.
 *
 * @property {{id:string, img:string, title:string}|null} currentEntry
 * 현재 선택되어 있거나 실제로 재생 중인 엔트리 객체입니다.
 * UI 제목 표시, 목록 active 상태 표시, 로컬 스토리지 동기화에 사용합니다.
 *
 * @property {"single"|"playlist"|"custom"} sourceType
 * 현재 큐가 어떤 방식으로 구성되었는지를 나타냅니다.
 * - single   : 단일 영상
 * - playlist : 공식 YouTube 재생목록 ID를 보존한 상태
 * - custom   : 셔플/필터링/역순 재배치 등으로 영상 ID 배열만 유지하는 사용자 정의 큐
 *
 * @property {string|null} playlistId
 * 공식 YouTube 재생목록 URL에서 추출한 playlist ID입니다.
 * sourceType 이 "playlist" 일 때만 의미가 있으며, 이 값이 있어야 IFrame API에
 * listType/list 조합으로 진짜 playlist source 를 다시 적용할 수 있습니다.
 */
let YConfig = {
    entries: [{
        id: "C0DPdy98e4c",
        img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
        title: "TEST VIDEO"
    }],
    lastIdx: -1,
    currentEntry: null,
    sourceType: "single",
    playlistId: null
};

// ==========================================
// 2. 서비스 클래스 정의 (API 통신 및 UI/플레이어 제어)
// ==========================================

/**
 * @class YouTubeAPIService
 * @description
 * 사용자가 입력한 YouTube URL 을 해석하고, 필요한 경우 YouTube Data API v3 를 호출해
 * 실제 재생 가능한 엔트리 목록으로 정규화하는 통신 전담 서비스입니다.
 *
 * 이 클래스의 핵심 역할은 "URL 해석"과 "영상 목록 정규화"이며,
 * 실제 플레이어 제어 책임은 갖지 않습니다.
 */
class YouTubeAPIService {
    // --- Public Methods ---

    /**
     * @public
     * @description
     * 사용자가 입력한 URL 이 단일 영상인지, 공식 재생목록인지 판별한 뒤,
     * 재생 가능한 엔트리 배열과 함께 그 큐의 원본 타입을 반환합니다.
     *
     * 구현상 재생목록 URL 에 videoId 와 list 가 동시에 들어있더라도,
     * 여기서는 공식 재생목록을 우선하여 playlist source 로 취급합니다.
     * 그 이유는 실제 재생기에서도 listType/list 기반의 진짜 playlist 큐를
     * 다시 구성할 수 있어야 단일 영상 UI 로 강등되지 않기 때문입니다.
     *
     * @param {string} url
     * 사용자가 입력한 YouTube 단일 영상 URL 또는 재생목록 URL 입니다.
     *
     * @returns {Promise<{entries:Array<{id:string, img:string, title:string}>, sourceType:"single"|"playlist", playlistId:string|null}>}
     * 플레이어가 바로 사용할 수 있는 정규화된 큐 정보입니다.
     */
    async fetchEntriesFromURL(url) {
        // URL 안에서 공식 재생목록 ID 와 단일 영상 ID 를 각각 추출합니다.
        const playlistIdMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        const videoIdMatch = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

        try {
            // 공식 재생목록 주소라면 playlist ID 를 유지한 채 전체 엔트리를 가져옵니다.
            if (playlistIdMatch) {
                const playlistId = playlistIdMatch[1];
                return {
                    entries: await this.#fetchPlaylistItems(playlistId),
                    sourceType: "playlist",
                    playlistId
                };
            }

            // 단일 영상 주소라면 단일 엔트리 배열로 정규화합니다.
            if (videoIdMatch) {
                return {
                    entries: await this.#fetchVideoItem(videoIdMatch[1]),
                    sourceType: "single",
                    playlistId: null
                };
            }

            // 어떠한 규칙에도 맞지 않는 주소는 빈 목록으로 처리합니다.
            return { entries: [], sourceType: "single", playlistId: null };
        } catch (err) {
            console.error("❌ API 호출 실패:" + err);
            pushSnackbar({ message: "데이터를 가져오는 데 실패했습니다.", type: "error" });
            return { entries: [], sourceType: "single", playlistId: null };
        }
    }

    // --- Private Properties ---

    /**
     * @private
     * @description YouTube Data API v3 호출에 사용하는 인증 키입니다.
     * @type {string}
     */
    #apiKey = "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo";

    // --- Private Methods ---

    /**
     * @private
     * @description
     * oEmbed 엔드포인트를 활용해 해당 영상이 최소한 퍼가기 가능한 상태인지 사전 검증합니다.
     * Data API 로 메타데이터를 받아와도 실제 embed 재생이 불가능한 경우가 있으므로,
     * 단일 영상은 이 검증을 먼저 통과한 경우에만 최종 엔트리로 채택합니다.
     *
     * @param {string} videoId 유효성을 검사할 YouTube 영상 고유 ID 입니다.
     * @returns {Promise<boolean>} embed 재생 가능성이 있다고 판단되면 true 를 반환합니다.
     */
    async #validateVideo(videoId) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
            return response.ok;
        } catch (error) {
            console.error(`Video validation failed for ${videoId}:` + error);
            return false;
        }
    }

    /**
     * @private
     * @description
     * 공식 YouTube 재생목록 ID 를 기준으로 playlistItems 엔드포인트를 반복 호출하여,
     * 재생 가능한 엔트리 목록을 누적 수집합니다.
     *
     * - 비공개 동영상 / 삭제된 동영상은 렌더링 대상에서 제외합니다.
     * - 다음 페이지 토큰이 있을 경우 계속 순회합니다.
     * - 과도한 목록 길이로 인한 UI 부담을 막기 위해 최대 200개까지만 수집합니다.
     *
     * @param {string} playlistId YouTube 공식 재생목록 고유 ID 입니다.
     * @returns {Promise<Array<{id:string, img:string, title:string}>>} 정규화가 끝난 엔트리 배열입니다.
     */
    async #fetchPlaylistItems(playlistId) {
        /**
         * @description 페이지네이션을 누적한 최종 엔트리 배열입니다.
         * @type {Array<{id:string, img:string, title:string}>}
         */
        let allEntries = [];

        /**
         * @description YouTube Data API 페이지네이션 토큰입니다.
         * @type {string}
         */
        let pageToken = "";

        /**
         * @description 한 번에 과도한 UI 렌더링을 방지하기 위한 최대 적재 개수입니다.
         * @type {number}
         */
        const MAX_RESULTS = 200;

        while (true) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.#apiKey}&part=snippet&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`;

            try {
                const res = await fetch(apiUrl);
                const data = await res.json();

                // API 할당량 초과, 잘못된 요청 등은 즉시 사용자에게 알려 주고 중단합니다.
                if (data.error) {
                    pushSnackbar({ message: `목록 로드 실패: ${data.error.message}`, type: "error" });
                    break;
                }

                if (!data.items) break;

                // 재생 불가능한 항목을 제거하고, 화면 렌더링용 최소 정보만 남깁니다.
                const fetchedEntries = data.items
                    .filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== "Private video" && item.snippet.title !== "Deleted video")
                    .map(item => ({
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
                    }));

                allEntries.push(...fetchedEntries);
                pageToken = data.nextPageToken;

                // 최대 개수에 도달했거나 다음 페이지가 없으면 순회를 종료합니다.
                if (allEntries.length >= MAX_RESULTS || !pageToken) break;
            } catch (err) {
                console.error("Network Error:" + err);
                break;
            }
        }

        return allEntries;
    }

    /**
     * @private
     * @description
     * 단일 영상 ID 에 대해 상세 메타데이터를 가져오고,
     * 사전 embed 검증까지 통과한 경우에만 엔트리 1개짜리 배열로 반환합니다.
     *
     * @param {string} videoId YouTube 영상 고유 ID 입니다.
     * @returns {Promise<Array<{id:string, img:string, title:string}>>} 재생 가능한 단일 엔트리 배열입니다.
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
 * @description
 * 플레이어 우측 패널 및 하단 재생 엔트리 목록 등,
 * 사용자가 직접 상호작용하는 모든 커스텀 UI 요소의 생성과 갱신을 전담하는 프런트엔드 뷰 관리자입니다.
 *
 * 이 클래스는 DOM 구성과 이벤트 바인딩만 담당하며,
 * 실제 재생 동작은 PlayerService 에 위임합니다.
 */
class UIManager {
    // --- Public Properties ---

    /**
     * @public
     * @description 현재 재생 중인 목록/영상의 제목을 표시하는 텍스트 노드 래퍼입니다.
     * @type {*}
     */
    TitleLabel = Dynamic.$("b");

    /**
     * @public
     * @description 저장된 대분류 재생목록 목록을 담는 루트 리스트 래퍼입니다.
     * @type {*}
     */
    PlayLists = Dynamic.$("ul");

    /**
     * @public
     * @description 현재 로드된 큐의 개별 엔트리 목록을 보여 주는 리스트 래퍼입니다.
     * 기본값은 숨김 상태로 시작하며, 실제 재생목록이 로드되면 표시됩니다.
     * @type {*}
     */
    EntryLists = Dynamic.$("ul", { style: "display: none;" });

    /**
     * @public
     * @description 현재 재생 위치(예: 3 / 20)를 표시하는 상태 라벨입니다.
     * @type {*}
     */
    EntryState = Dynamic.$("li", { class: "entry-status", style: "padding: 4px 8px; font-weight: bold; color: #999;" });

    /**
     * @public
     * @description 패널 상단 헤더 영역 전체를 담당하는 래퍼입니다.
     * 제목, 대표 아이콘, 화살표 토글 UI 를 모두 포함합니다.
     * @type {*}
     */
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" });

    /**
     * @public
     * @description 저장된 재생목록 목록과 현재 큐 목록을 함께 담는 내부 컨테이너입니다.
     * @type {*}
     */
    listItemsContainer = Dynamic.$("div", { class: "ytv-list-inner" });

    /**
     * @public
     * @description 우측 패널이 현재 열려 있는지 여부를 나타내는 상태 플래그입니다.
     * @type {boolean}
     */
    PanelVisible = true;

    // --- Public Methods ---

    /**
     * @public
     * @description UIManager 생성 시 데이터 수집 전담 서비스와 연결합니다.
     * @param {YouTubeAPIService} apiService URL 해석 및 엔트리 수집을 담당하는 서비스입니다.
     */
    constructor(apiService) {
        this.#apiService = apiService;
    }

    /**
     * @public
     * @description UI 이벤트가 실제 재생 동작으로 이어질 수 있도록 PlayerService 참조를 주입합니다.
     * @param {PlayerService} playerService 플레이어 생명주기와 재생 제어를 담당하는 서비스입니다.
     */
    setPlayerService(playerService) {
        this.#playerService = playerService;
    }

    /**
     * @public
     * @description
     * 플레이어 우측 패널의 헤더 구조와 내부 리스트 컨테이너를 다시 조립합니다.
     * 프래그먼트가 재렌더링된 뒤에도 동일한 UI 골격을 안정적으로 복원하기 위한 함수입니다.
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
     * @public
     * @description 우측 재생목록 패널의 표시 여부를 토글합니다.
     * @param {Event} e 패널 토글 버튼 클릭 이벤트입니다.
     */
    togglePanel(e) {
        this.PanelVisible = !this.PanelVisible;
        const list = document.querySelector(".ytv-list");
        if (!list) return;

        list.style.width = this.PanelVisible ? "" : "0";
        list.style.height = this.PanelVisible ? "" : "0";
        e.target.classList.toggle("ytv-list-open", this.PanelVisible);
    }

    /**
     * @public
     * @description
     * 현재 재생 중인 엔트리 정보를 제목/인덱스/active 스타일에 반영합니다.
     * 별도 렌더링 없이도 현재 재생 상태만 빠르게 갱신할 수 있도록 만든 경량 동기화 함수입니다.
     *
     * @param {{id:string, img:string, title:string}} entry 현재 활성 엔트리입니다.
     * @param {number} index 현재 활성 엔트리의 인덱스입니다.
     * @param {number} total 전체 큐 길이입니다.
     */
    updateNowPlaying(entry, index, total) {
        this.TitleLabel.set({ text: entry.title });
        this.EntryState.set({ text: `${index + 1} / ${total}` });

        const activeNode = this.EntryLists.node.querySelector(".active");
        if (activeNode) activeNode.classList.remove("active");

        const items = this.EntryLists.node.querySelectorAll(".entry-item");
        if (items[index]) items[index].classList.add("active");
    }

    /**
     * @public
     * @description
     * 로컬 저장소에 저장된 사용자 재생목록 카테고리와 URL 목록을 바탕으로
     * 우측 패널의 저장된 재생목록 목록 UI 를 새로 구성합니다.
     */
    buildPlaylistList() {
        const playlistMap = DataResource.Data.basic.playlist;
        this.PlayLists.reset();

        // 재생목록 추가 입력 영역을 항상 상단에 고정으로 노출합니다.
        this.PlayLists.add(
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-main-title", style: "width: 100%; margin-bottom: 8px;", placeholder: "큰 타이틀" })),
            Dynamic.$("li").add(Dynamic.$("input", { id: "input-playlist-url", style: "width: 100%; margin-bottom: 8px;", placeholder: "YouTube URL" })),
            Dynamic.$("li").add(Dynamic.$("button", { text: "➕ 추가", id: "input-playlist-button", onclick: () => this.#addPlaylist() }))
        );

        // 저장된 카테고리와 하위 URL 항목을 정렬 후 차례대로 렌더링합니다.
        Object.keys(playlistMap).sort().forEach(title => {
            this.PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));
            Object.entries(playlistMap[title]).sort().forEach(([name, url]) => this.PlayLists.add(this.#createPlaylistItem(title, name, url)));
        });
    }

    /**
     * @public
     * @description
     * 현재 플레이어 큐를 기준으로 하단 엔트리 목록을 다시 구성합니다.
     * 큐 길이가 2개 이상일 경우 셔플/역순/필터링 등 보조 제어 버튼도 함께 추가합니다.
     *
     * @param {Array<{id:string, img:string, title:string}>} entries 현재 플레이어 큐입니다.
     */
    buildEntryList(entries) {
        this.EntryLists.reset();

        // 다중 엔트리일 때만 목록 재배치 기능 버튼을 제공합니다.
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

        // 현재 큐가 구성되면 저장된 재생목록 목록 대신 엔트리 목록을 우선 노출합니다.
        this.ListHeader.node.classList.add("ytv-playlist-open");
        this.PlayLists.set({ style: "display: none" });
        this.EntryLists.set({ style: "" });
    }

    // --- Private Properties ---

    /**
     * @private
     * @description UI 이벤트를 실제 재생 동작으로 위임하기 위한 PlayerService 참조입니다.
     * @type {PlayerService|null}
     */
    #playerService = null;

    /**
     * @private
     * @description URL 을 재생 가능한 엔트리 목록으로 변환하는 API 서비스 참조입니다.
     * @type {YouTubeAPIService}
     */
    #apiService;

    /**
     * @private
     * @description 동일한 목록을 중복 요청하지 않도록 막는 요청 중 플래그입니다.
     * @type {boolean}
     */
    #isFetching = false;

    // --- Private Methods ---

    /**
     * @private
     * @description 저장된 재생목록 목록과 현재 엔트리 목록 사이의 보기 모드를 전환합니다.
     * @param {Event} e 제목 헤더 클릭 이벤트입니다.
     */
    #togglePlaylistView(e) {
        e.preventDefault();
        const showEntries = this.ListHeader.node.classList.toggle("ytv-playlist-open");
        this.PlayLists.set({ style: showEntries ? "display: none" : "" });
        this.EntryLists.set({ style: showEntries ? "" : "display: none" });
    }

    /**
     * @private
     * @description 사용자가 입력한 제목과 URL 을 로컬 저장소의 재생목록 맵에 추가합니다.
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
     * @description
     * 저장된 재생목록 URL 하나를 클릭 가능한 목록 아이템으로 생성합니다.
     * 클릭 시 URL 을 실제 엔트리 배열로 로드한 뒤 PlayerService 에 새 큐로 전달합니다.
     *
     * @param {string} title 상위 카테고리 제목입니다.
     * @param {string} name 사용자에게 보여 줄 재생목록 표시명입니다.
     * @param {string} url 실제 YouTube URL 입니다.
     * @returns {*} Dynamic UI 항목 객체입니다.
     */
    #createPlaylistItem(title, name, url) {
        return Dynamic.$("li", { class: "playlist-item" }).add(
            Dynamic.$("a", { href: url, text: name, onclick: async e => {
                e.preventDefault();
                if (!this.#playerService || this.#isFetching) return;

                this.#isFetching = true;
                pushSnackbar({ message: `'${name}' 목록을 불러오는 중...`, type: "normal" });

                try {
                    const payload = await this.#apiService.fetchEntriesFromURL(url);
                    if (payload.entries && payload.entries.length > 0) {
                        this.#playerService.loadNewPlaylist(payload);
                        pushSnackbar({ message: "재생목록 로드 완료!", type: "normal" });
                    } else {
                        pushSnackbar({ message: "재생 가능한 영상이 없거나 로드에 실패했습니다.", type: "error" });
                    }
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

    /**
     * @private
     * @description 저장된 재생목록 표시명을 변경합니다.
     * @param {Event} e 버튼 클릭 이벤트입니다.
     * @param {string} title 상위 카테고리 제목입니다.
     * @param {string} oldName 기존 표시명입니다.
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
     * @description 저장된 재생목록 URL 항목을 삭제합니다.
     * @param {Event} e 버튼 클릭 이벤트입니다.
     * @param {string} title 상위 카테고리 제목입니다.
     * @param {string} name 삭제할 하위 항목 표시명입니다.
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
     * @description 공통 스타일의 제어 버튼을 생성하는 내부 헬퍼입니다.
     * @param {string} icon 버튼에 표시할 아이콘 문자열입니다.
     * @param {string} title 버튼 툴팁 텍스트입니다.
     * @param {Function} onClick 클릭 시 실행할 핸들러입니다.
     * @returns {*} 생성된 버튼 객체입니다.
     */
    #createControlButton(icon, title, onClick) {
        return Dynamic.$("button", { class: "playerButton", text: icon, title, onclick: onClick });
    }
}

/**
 * @class PlayerService
 * @description
 * 실제 YouTube IFrame Player API 인스턴스의 생명주기 관리,
 * 재생목록 큐 적용, 현재 재생 위치 동기화, 오류 대응, 셔플/필터링 등
 * 재생과 직접 관련된 모든 상태 전이를 전담하는 핵심 서비스입니다.
 *
 * 이번 수정의 핵심은 "매 트랙마다 새 플레이어를 만드는 구조"를 버리고,
 * 가능한 한 하나의 플레이어를 유지한 채 queueing API 로 playlist 를 교체하도록 바꾼 점입니다.
 */
class PlayerService {
    // --- Public Methods ---

    /**
     * @public
     * @description PlayerService 생성 시 UIManager 와 연결하고, 백그라운드 생명주기 보조용 무음 오디오를 준비합니다.
     * @param {UIManager} uiManager 플레이어 상태를 UI 에 반영할 뷰 관리자입니다.
     */
    constructor(uiManager) {
        this.#uiManager = uiManager;
        this.#initKeepAliveAudio();
    }

    /**
     * @public
     * @description
     * 프래그먼트 재렌더링 이후 전체 UI 와 플레이어를 다시 동기화합니다.
     * 저장된 재생목록 패널을 복원하고, 현재 YConfig 를 기준으로 플레이어를 재초기화합니다.
     */
    refreshAll() {
        this.#uiManager.initializeBaseLayout();
        this.#uiManager.buildPlaylistList();
        this.initializePlayer(true);
    }

    /**
     * @public
     * @description
     * YouTube IFrame API 플레이어를 생성하거나, 이미 생성되어 있다면 현재 큐만 다시 적용합니다.
     *
     * 핵심 원칙은 다음과 같습니다.
     * 1. 플레이어 인스턴스 자체는 가능한 재사용합니다.
     * 2. 실제 재생목록 전환은 loadPlaylist / playVideoAt / loadVideoById 로 처리합니다.
     * 3. 프래그먼트가 새로 렌더링되었거나 컨테이너가 사라진 경우에만 강제 재생성합니다.
     *
     * @param {boolean} [forceRecreate=false]
     * true 이면 기존 플레이어를 정리하고 컨테이너부터 다시 구성합니다.
     */
    initializePlayer(forceRecreate = false) {
        if (!YConfig.entries || YConfig.entries.length === 0) return;

        const playIndex = this.#resolvePlayIndex();
        const containerMissing = !document.getElementById("ytv-player");

        if (forceRecreate || containerMissing) {
            this.#destroyPlayer();
            this.#ensurePlayerContainer();
        }

        // 기존 플레이어가 이미 살아 있고 ready 상태라면 큐만 재적용하면 충분합니다.
        if (this.#YTPlayer) {
            if (this.#playerReady) {
                this.#applyQueueToPlayer(playIndex);
                this.refreshPlaylistStatus();
            }
            return;
        }

        this.#ensurePlayerContainer();

        /**
         * @description 플레이어 공통 파라미터입니다.
         * enablejsapi 는 widget API 가 내부적으로 세팅하므로 중복 전달하지 않습니다.
         * @type {{playsinline:number, rel:number, origin?:string}}
         */
        const playerVars = {
            playsinline: 1,
            rel: 0
        };

        const origin = this.#getSafeOrigin();
        if (origin) playerVars.origin = origin;

        // 새 플레이어가 생성될 때마다 nonce 를 증가시켜 stale event 를 걸러냅니다.
        const nonce = ++this.#playerNonce;
        this.#playerReady = false;

        this.#YTPlayer = new YT.Player("ytv-player", {
            host: "https://www.youtube.com",
            videoId: YConfig.entries[playIndex]?.id || "",
            playerVars,
            events: {
                onReady: event => this.#onPlayerReady(event, nonce),
                onStateChange: event => this.#onPlayerStateChange(event, nonce),
                onError: event => this.#onPlayerError(event, nonce),
                onAutoplayBlocked: event => this.#onAutoplayBlocked(event, nonce)
            }
        });
    }

    /**
     * @public
     * @description 현재 YConfig 상태를 기준으로 엔트리 목록과 제목/active 상태를 UI 에 반영합니다.
     */
    refreshPlaylistStatus() {
        if (!YConfig.entries.length || !YConfig.currentEntry) return;
        this.#uiManager.buildEntryList(YConfig.entries);
        this.#uiManager.updateNowPlaying(YConfig.currentEntry, YConfig.lastIdx, YConfig.entries.length);
    }

    /**
     * @public
     * @description
     * 외부에서 새 재생 큐가 들어왔을 때 YConfig 를 정규화하고 플레이어에 반영합니다.
     * 이전 코드와의 호환을 위해 단순 엔트리 배열도 허용하며,
     * 새 구조에서는 sourceType / playlistId 를 가진 payload 객체도 허용합니다.
     *
     * @param {Array<{id:string, img:string, title:string}>|{entries:Array<{id:string, img:string, title:string}>, sourceType?:"single"|"playlist"|"custom", playlistId?:string|null}} payload
     * 새로 로드할 큐 정보입니다.
     */
    loadNewPlaylist(payload) {
        const normalized = Array.isArray(payload)
            ? {
                entries: payload,
                sourceType: payload.length > 1 ? "custom" : "single",
                playlistId: null
            }
            : {
                entries: payload?.entries || [],
                sourceType: payload?.sourceType || ((payload?.entries?.length || 0) > 1 ? "custom" : "single"),
                playlistId: payload?.playlistId || null
            };

        YConfig.entries = normalized.entries;
        YConfig.currentEntry = normalized.entries[0] || null;
        YConfig.lastIdx = normalized.entries.length ? 0 : -1;
        YConfig.sourceType = normalized.sourceType;
        YConfig.playlistId = normalized.playlistId;

        if (!YConfig.entries.length) return;

        if (!this.#YTPlayer || !this.#playerReady) {
            this.initializePlayer(!this.#YTPlayer);
        } else {
            this.#applyQueueToPlayer(0);
            this.refreshPlaylistStatus();
        }
    }

    /**
     * @public
     * @description
     * 커스텀 UI 목록에서 특정 엔트리를 클릭했을 때 해당 인덱스로 점프합니다.
     * 단일 영상이면 loadVideoById 를 사용하고,
     * 다중 큐이면 현재 플레이어의 playlist 상태를 유지한 채 playVideoAt 으로 이동합니다.
     *
     * @param {number} index 이동할 대상 인덱스입니다.
     */
    playVideoAt(index) {
        if (index < 0 || index >= YConfig.entries.length) return;

        YConfig.currentEntry = YConfig.entries[index];
        YConfig.lastIdx = index;
        this.refreshPlaylistStatus();

        if (!this.#YTPlayer || !this.#playerReady) {
            this.initializePlayer(!this.#YTPlayer);
            return;
        }

        try {
            if (YConfig.entries.length > 1 && typeof this.#YTPlayer.playVideoAt === "function") {
                this.#YTPlayer.playVideoAt(index);
            } else {
                this.#YTPlayer.loadVideoById(YConfig.entries[index].id, 0);
            }
        } catch (error) {
            console.warn("playVideoAt fallback triggered:", error);
            this.#applyQueueToPlayer(index);
        }
    }

    /**
     * @public
     * @description
     * 현재 재생 중인 영상을 첫 번째로 고정한 채 나머지 큐만 무작위로 섞습니다.
     * 공식 재생목록 순서를 보존할 수 없으므로 sourceType 을 custom 으로 바꿉니다.
     */
    shuffleEntries() {
        const current = YConfig.currentEntry;
        if (!current) return;

        const others = YConfig.entries.filter(e => e.id !== current.id);
        others.sort(() => Math.random() - 0.5);
        YConfig.entries = [current, ...others];
        YConfig.lastIdx = 0;
        YConfig.sourceType = "custom";
        YConfig.playlistId = null;
        this.#reloadCurrentQueue(0);
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }

    /**
     * @public
     * @description
     * 현재 큐를 역순으로 재배치합니다.
     * 공식 playlist ID 와 실제 순서가 달라지므로 이후에는 custom 큐로 취급합니다.
     */
    reverseEntries() {
        YConfig.entries.reverse();
        YConfig.lastIdx = YConfig.entries.findIndex(e => e.id === YConfig.currentEntry?.id);
        YConfig.sourceType = "custom";
        YConfig.playlistId = null;
        this.#reloadCurrentQueue(YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0);
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }

    /**
     * @public
     * @description
     * 사용자가 입력한 번호/범위 규칙을 해석하여 현재 큐 중 일부만 추출한 새 재생목록을 구성합니다.
     * 필터링 결과는 공식 playlist 의 원래 순서를 더 이상 보존하지 않으므로 custom 큐로 간주합니다.
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

        /**
         * @description 사용자 입력으로부터 계산된 1-based 인덱스 집합입니다.
         * @type {Set<number>}
         */
        const indices = new Set();

        const tokens = input.trim().split(/\s+/);
        const maxIndex = YConfig.entries.length;

        for (const token of tokens) {
            if (/^\d+$/.test(token)) {
                indices.add(Number(token));
            } else if (/^(\d+)[-~](\d+)$/.test(token)) {
                let [a, b] = token.match(/^(\d+)[-~](\d+)$/).slice(1).map(Number);
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
        YConfig.sourceType = parsed.length > 1 ? "custom" : "single";
        YConfig.playlistId = null;

        let newIndex = YConfig.entries.findIndex(e => e.id === YConfig.currentEntry?.id);
        if (newIndex === -1) {
            newIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
        }

        YConfig.lastIdx = newIndex;
        this.#reloadCurrentQueue(newIndex);
        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" });
    }

    // --- Private Properties ---

    /**
     * @private
     * @description 실제 YouTube IFrame Player API 인스턴스입니다.
     * @type {YT.Player|null}
     */
    #YTPlayer = null;

    /**
     * @private
     * @description 플레이어 상태를 UI 에 반영하기 위한 UIManager 참조입니다.
     * @type {UIManager}
     */
    #uiManager;

    /**
     * @private
     * @description 모바일 환경에서 백그라운드 생명주기 유지를 돕기 위한 무음 오디오 객체입니다.
     * @type {HTMLAudioElement|null}
     */
    #keepAliveAudio = null;

    /**
     * @private
     * @description 현재 플레이어 인스턴스가 onReady 를 통과했는지 여부를 나타냅니다.
     * @type {boolean}
     */
    #playerReady = false;

    /**
     * @private
     * @description 새 플레이어가 생성될 때마다 증가하는 식별자입니다.
     * 늦게 도착한 이전 플레이어의 이벤트를 무시하기 위한 nonce 로 사용합니다.
     * @type {number}
     */
    #playerNonce = 0;

    // --- Private Methods ---

    /**
     * @private
     * @description
     * 현재 플레이어 인스턴스를 안전하게 파괴하고 내부 참조를 초기화합니다.
     * iframe 제거 시점의 예외를 삼켜 UI 전체가 깨지지 않도록 방어적으로 처리합니다.
     */
    #destroyPlayer() {
        if (this.#YTPlayer) {
            try {
                this.#YTPlayer.destroy();
            } catch (error) {
                console.warn("YT.Player.destroy() failed:", error);
            }
        }
        this.#YTPlayer = null;
        this.#playerReady = false;
    }

    /**
     * @private
     * @description
     * 플레이어가 마운트될 div 컨테이너가 존재하는지 확인하고,
     * 없으면 동적으로 다시 생성합니다.
     *
     * 프래그먼트 재렌더링 또는 destroy 이후 DOM 에서 컨테이너가 사라졌을 때를 대비한 복원 함수입니다.
     *
     * @returns {HTMLDivElement} 플레이어 마운트 대상 컨테이너입니다.
     */
    #ensurePlayerContainer() {
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
        return playerContainer;
    }

    /**
     * @private
     * @description
     * 현재 YConfig.currentEntry 를 기준으로 실제 재생 시작 인덱스를 계산합니다.
     * currentEntry 가 비어 있거나 큐 안에서 찾을 수 없으면 첫 번째 엔트리를 기본값으로 사용합니다.
     *
     * @returns {number} 클램프된 유효 재생 시작 인덱스입니다.
     */
    #resolvePlayIndex() {
        let playIndex = YConfig.currentEntry ? YConfig.entries.findIndex(e => e.id === YConfig.currentEntry.id) : -1;
        if (playIndex === -1) {
            playIndex = 0;
            YConfig.currentEntry = YConfig.entries[0] || null;
        }
        YConfig.lastIdx = playIndex;
        return playIndex;
    }

    /**
     * @private
     * @description
     * 현재 페이지가 http/https 로 제공되는 경우에만 안전한 origin 값을 반환합니다.
     * file:// 나 비표준 스킴 환경에서는 잘못된 origin 전달로 인한 문제를 피하기 위해 null 을 반환합니다.
     *
     * @returns {string|null} 안전하게 전달 가능한 origin 또는 null 입니다.
     */
    #getSafeOrigin() {
        if (!window?.location) return null;
        if (!/^https?:$/.test(window.location.protocol) || !window.location.host) return null;
        return window.location.origin;
    }

    /**
     * @private
     * @description
     * 현재 YConfig 상태를 실제 YouTube 플레이어의 큐에 반영합니다.
     *
     * - 공식 playlist ID 가 살아 있으면 listType/list 기반의 진짜 playlist 로 로드합니다.
     * - 셔플/필터링 등으로 변형된 custom 큐면 영상 ID 배열 기반으로 로드합니다.
     * - 단일 영상이면 loadVideoById 로 전환합니다.
     *
     * @param {number} [startIndex=0] 큐 로드 후 시작할 인덱스입니다.
     * @param {YT.Player} [player=this.#YTPlayer] 큐를 적용할 대상 플레이어 인스턴스입니다.
     */
    #applyQueueToPlayer(startIndex = 0, player = this.#YTPlayer) {
        if (!player || !YConfig.entries.length) return;

        const ids = YConfig.entries.map(entry => entry.id).filter(Boolean);
        if (!ids.length) return;

        const index = Math.max(0, Math.min(startIndex, ids.length - 1));

        if (YConfig.sourceType === "playlist" && YConfig.playlistId) {
            player.loadPlaylist({
                listType: "playlist",
                list: YConfig.playlistId,
                index,
                startSeconds: 0
            });
        } else if (ids.length > 1) {
            player.loadPlaylist(ids, index, 0);
        } else {
            player.loadVideoById(ids[0], 0);
        }

        // 기존 구현이 모듈 전체 반복 재생을 전제로 했으므로, 다중 큐는 loop 를 유지합니다.
        if (ids.length > 1 && typeof player.setLoop === "function") {
            try {
                player.setLoop(true);
            } catch (error) {
                console.warn("setLoop() failed:", error);
            }
        }
    }

    /**
     * @private
     * @description
     * 현재 큐의 순서가 바뀌었을 때 플레이어에 다시 반영합니다.
     * 플레이어가 아직 준비되지 않았다면 생성부터 다시 진행합니다.
     *
     * @param {number} [startIndex=YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0] 큐 재적용 후 시작할 인덱스입니다.
     */
    #reloadCurrentQueue(startIndex = YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0) {
        if (!this.#YTPlayer || !this.#playerReady) {
            this.initializePlayer(!this.#YTPlayer);
            return;
        }

        this.#applyQueueToPlayer(startIndex);
        this.refreshPlaylistStatus();
    }

    /**
     * @private
     * @description
     * 실제 플레이어 상태를 읽어 YConfig.currentEntry / lastIdx 를 역으로 동기화합니다.
     * 우선 getPlaylistIndex() 를 사용하고, 실패하면 getVideoData().video_id 로 보정합니다.
     *
     * @param {YT.Player} [player=this.#YTPlayer] 상태를 읽어 올 플레이어 인스턴스입니다.
     */
    #syncCurrentEntryFromPlayer(player = this.#YTPlayer) {
        if (!player || !YConfig.entries.length) return;

        let index = -1;
        try {
            if (YConfig.entries.length > 1 && typeof player.getPlaylistIndex === "function") {
                const playlistIndex = player.getPlaylistIndex();
                if (Number.isInteger(playlistIndex)) index = playlistIndex;
            }
        } catch (error) {
            console.warn("getPlaylistIndex() failed:", error);
        }

        if (index < 0) {
            try {
                const videoId = player.getVideoData?.().video_id;
                if (videoId) index = YConfig.entries.findIndex(entry => entry.id === videoId);
            } catch (error) {
                console.warn("getVideoData() failed:", error);
            }
        }

        if (index < 0 || index >= YConfig.entries.length) {
            index = YConfig.lastIdx >= 0 ? YConfig.lastIdx : 0;
        }

        YConfig.lastIdx = index;
        YConfig.currentEntry = YConfig.entries[index] || YConfig.currentEntry || YConfig.entries[0] || null;
        this.refreshPlaylistStatus();
    }

    /**
     * @private
     * @description
     * 콜백이 현재 살아 있는 플레이어 인스턴스에서 발생한 이벤트인지 판별합니다.
     * destroy 후 늦게 도착한 이전 iframe 이벤트를 걸러 postMessage race 를 줄이기 위한 핵심 보호 장치입니다.
     *
     * @param {{target:YT.Player}} event IFrame API 이벤트 객체입니다.
     * @param {number} nonce 플레이어 생성 시점의 식별자입니다.
     * @returns {boolean} 현재 플레이어 기준 stale 이벤트면 true 입니다.
     */
    #isStaleEvent(event, nonce) {
        return nonce !== this.#playerNonce || !this.#YTPlayer || event.target !== this.#YTPlayer;
    }

    /**
     * @private
     * @description
     * 모바일 환경에서 백그라운드 탭 차단을 완화하기 위한 무음 오디오를 생성합니다.
     * 볼륨을 완전 0 으로 두지 않고 0.01 로 미세 조정해, 일부 모바일 환경에서
     * 완전 무음 미디어가 곧바로 정리되는 문제를 우회합니다.
     */
    #initKeepAliveAudio() {
        this.#keepAliveAudio = new Audio();
        this.#keepAliveAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        this.#keepAliveAudio.loop = true;
        this.#keepAliveAudio.volume = 0.01;
    }

    /**
     * @private
     * @description
     * 플레이어 ready 이벤트를 처리합니다.
     * stale 이벤트를 제거한 뒤 현재 큐를 실제 플레이어에 적용하고 UI 를 초기 동기화합니다.
     *
     * @param {{target:YT.Player}} event IFrame API ready 이벤트입니다.
     * @param {number} nonce 플레이어 생성 시점의 식별자입니다.
     */
    #onPlayerReady(event, nonce) {
        if (this.#isStaleEvent(event, nonce)) return;

        this.#playerReady = true;
        this.#applyQueueToPlayer(this.#resolvePlayIndex(), event.target);
        this.refreshPlaylistStatus();
    }

    /**
     * @private
     * @description
     * 플레이어 상태 변화에 따라 keep-alive 오디오, mediaSession, 로컬 스토리지,
     * 현재 엔트리 인덱스 동기화를 수행합니다.

     *
     * @param {{data:number, target:YT.Player}} event IFrame API 상태 변화 이벤트입니다.
     * @param {number} nonce 플레이어 생성 시점의 식별자입니다.
     */
    #onPlayerStateChange(event, nonce) {
        if (this.#isStaleEvent(event, nonce)) return;

        if (event.data === YT.PlayerState.PLAYING) {
            this.#keepAliveAudio?.play().catch(() => {});
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
            this.#syncCurrentEntryFromPlayer(event.target);
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
        }
        else if (event.data === YT.PlayerState.PAUSED) {
            this.#keepAliveAudio?.pause();
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
            localStorage.setItem("YConfig", JSON.stringify(YConfig));
        }
        else if (event.data === YT.PlayerState.ENDED) {
            localStorage.setItem("YConfig", JSON.stringify(YConfig));

            // 단일 영상은 기존 모듈의 반복 재생 의도를 유지하기 위해 직접 다시 로드합니다.
            if (YConfig.entries.length === 1 && YConfig.currentEntry) {
                try {
                    event.target.loadVideoById(YConfig.currentEntry.id, 0);
                } catch (error) {
                    console.warn("single-video loop fallback failed:", error);
                }
            }
        }
    }

    /**
     * @private
     * @description 브라우저가 자동 재생을 차단한 경우 사용자에게 즉시 안내 메시지를 표시합니다.
     * @param {{target:YT.Player}} event IFrame API 자동 재생 차단 이벤트입니다.
     * @param {number} nonce 플레이어 생성 시점의 식별자입니다.
     */
    #onAutoplayBlocked(event, nonce) {
        if (this.#isStaleEvent(event, nonce)) return;
        pushSnackbar({ message: "브라우저가 자동 재생을 차단했습니다. 플레이 버튼을 눌러 주세요.", type: "normal" });
    }

    /**
     * @private
     * @description
     * 재생 불가 영상이나 embed 차단 등 플레이어 오류가 발생했을 때 다음 엔트리로 건너뜁니다.
     * stale 이벤트는 무시하고, 다중 큐일 때만 자동 스킵합니다.
     *
     * @param {{data:number, target:YT.Player}} event IFrame API 오류 이벤트입니다.
     * @param {number} nonce 플레이어 생성 시점의 식별자입니다.
     */
    #onPlayerError(event, nonce) {
        if (this.#isStaleEvent(event, nonce)) return;

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
        } else {
            pushSnackbar({ message: "재생할 수 있는 영상이 없습니다.", type: "error" });
        }
    }
}

// ==========================================
// 3. 전역 인스턴스 초기화 및 모듈 내보내기
// ==========================================

/**
 * @description 현재 페이지에서 활성화된 PlayerService 싱글톤 참조입니다.
 * 프래그먼트가 다시 렌더링되어도 서비스 인스턴스를 재사용하기 위해 모듈 레벨에 보관합니다.
 * @type {PlayerService|null}
 */
let activePlayerService = null;

/**
 * @description
 * 외부 저장소에서 복원한 플레이어 상태를 YConfig 에 덮어쓰기 위한 전역 인터페이스입니다.
 * 저장 형식이 예전 버전일 수도 있으므로, 실제 사용 시에는 PlayerService 내부에서 다시 정규화합니다.
 *
 * @param {typeof YConfig} savedPlayerInstance 외부에서 복원한 플레이어 상태 객체입니다.
 */
const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance;

/**
 * @description
 * 플레이어 모듈의 실제 진입점인 Dynamic.Fragment 입니다.
 *
 * 최초 마운트 시에는 서비스 객체들을 생성하고 서로 연결하며,
 * 이후 다시 진입할 때는 기존 서비스 인스턴스를 재사용하면서 현재 DOM 에 맞게 refreshAll() 만 수행합니다.
 */
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("button", { class: "ytv-panel-toggle-btn ytv-list-open" }).add(
            Dynamic.$("span", { text: "◀" })
        ),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    // 서비스 객체가 없을 때만 최초 초기화를 진행하여 불필요한 중복 생성과 메모리 낭비를 막습니다.
    if (!activePlayerService) {
        const apiService = new YouTubeAPIService();
        const uiManager = new UIManager(apiService);
        activePlayerService = new PlayerService(uiManager);
        uiManager.setPlayerService(activePlayerService);
    }

    // 프래그먼트가 다시 렌더링되더라도 현재 상태를 기준으로 UI / 플레이어를 재동기화합니다.
    activePlayerService.refreshAll();
});

export { restoreYConfig };
export default Player;
