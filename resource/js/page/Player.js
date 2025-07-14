import { Dynamic } from "../init/module.js";
import { pushSnackbar } from "../util/Tools.js";
import DataResource from "../util/DataResource.js";

let TimeTracker = null;
let TitleLabel = null;
let PlayLists = null;
let EntryLists = null;
let EntryState = null;
let ListHeader = null;
let YTPlayer = null;

let YConfig = {
    entries: [{
        id: "C0DPdy98e4c",
        img: "https://i.ytimg.com/vi/C0DPdy98e4c/mqdefault.jpg",
        title: "TEST VIDEO"
    }],
    lastIdx: -1,
    currentEntry: null,
    playbackPosition: 0
};

const restoreYConfig = savedPlayerInstance => YConfig = savedPlayerInstance; 

const loadPlaylist = () => {
    const playlist = YConfig.entries.map(entry => entry.id);

    if (YConfig.currentEntry) {
        ListHeader.node.classList.add("ytv-playlist-open");
        TitleLabel.set({ text: YConfig.currentEntry.title });
        PlayLists.set({ style: "display: none" });
        EntryLists.set({ style: "" });
    } else YConfig.currentEntry = YConfig.entries[0];

    let playIndex = playlist.indexOf(YConfig.currentEntry.id);
    if (playIndex === -1) {
        playIndex = 0;
        YConfig.currentEntry = YConfig.entries[0];
        YConfig.playbackPosition = 0;
    }
    YConfig.lastIdx = -1;

    YTPlayer.loadPlaylist(playlist, playIndex, YConfig.playbackPosition, "default");
    YTPlayer.setLoop(true);

    const createButton = (icon, onClick) => Dynamic.$("button", { class: "playerButton", text: icon, onclick: onClick });
    
    if (1 < playlist.length) EntryLists.reset(
        createButton("🔄", () => loadPlaylist()),
        createButton("🔀", () => {
            YConfig.entries = [...YConfig.entries].sort(() => Math.random() - 0.5);
            loadPlaylist();
            pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
        }),
        createButton("↩️", () => {
            YConfig.entries.reverse();
            loadPlaylist();
            pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
        }),
        createButton("🎯", () => {
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

            for (const token of tokens) {
                if (/^\d+$/.test(token)) indices.add(+token);
                else if (/^(\d+)[-~](\d+)$/.test(token)) {
                    let [ , a, b ] = token.match(/^(\d+)[-~](\d+)$/);
                    for (let i = Math.min(a = +a, b = +b); i <= Math.max(a, b); i++) indices.add(i);
                } else if (/^[-~](\d+)$/.test(token)) {
                    const end = +token.match(/^[-~](\d+)$/)[1];
                    for (let i = 1; i <= end; i++) indices.add(i);
                } else if (/^(\d+)[-~]$/.test(token)) {
                    const start = +token.match(/^(\d+)[-~]$/)[1];
                    for (let i = start; i <= playlist.length; i++) indices.add(i);
                }
            }

            const parsed = [...indices].map(n => YConfig.entries[n - 1]).filter(Boolean);
            if (!parsed.length) return pushSnackbar({ message: "선택이 잘못되었습니다.", type: "error" });

            YConfig.entries = parsed;
            loadPlaylist();
            pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생합니다.`, type: "normal" });
        })
    )

    EntryLists.add(
        EntryState,
        YConfig.entries.map((entry, i) => 
            Dynamic.$("li", { class: "entry-item", onclick: () => {
                YConfig.currentEntry = entry;
                YConfig.playbackPosition = 0;
                loadPlaylist();
                TitleLabel.set({ text: entry.title });
            }}).add(
                Dynamic.$("b", { text : i + 1 }),
                Dynamic.$("img", { src: entry.img }),
                Dynamic.$("span", { text: entry.title })
            )
        )
    )
};

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", { id: "dynamic_player", class: "ytv-canvas ytv-full" }).add(
        Dynamic.$("div", { id: "ytv-player", class: "ytv-video" }),
        Dynamic.$("div", { class: "ytv-list" })
    )
).registAction(() => {
    const playlistMap = DataResource.Data.basic.playlist;
    const YTPlayerSettings = {
        height: "360",
        width: "640",
        playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0
        },
        events: {
            onReady: () => loadPlaylist(),
            onError: e => console.error("Player error", e)
        }
    }
    
    clearInterval(TimeTracker);
    TimeTracker = setInterval(() => {
        if (!YTPlayer || YTPlayer.getPlayerState() !== YT.PlayerState.PLAYING) return;
        
        const idx = YTPlayer.getPlaylistIndex();
        YConfig.playbackPosition = YTPlayer.getCurrentTime();
                    
        if (0 <= idx && idx !== YConfig.lastIdx) {
            const entrys = EntryLists.node.querySelectorAll(".entry-item");
            entrys[YConfig.lastIdx]?.classList.toggle("active");
            entrys[idx]?.classList.toggle("active");

            YConfig.lastIdx = idx;
            YConfig.currentEntry = YConfig.entries[idx];
            EntryState.set({ text: `${idx + 1} / ${entrys.length}` });
        }

        localStorage.setItem("YConfig", JSON.stringify(YConfig));
    }, 1000);
    
    TitleLabel = Dynamic.$("b", { text: YConfig.title });
    PlayLists = Dynamic.$("ul").add(
        Dynamic.$("li").add(
            Dynamic.$("input", { id: "input-main-title", style: "width: 100%; margin-bottom: 8px;", placeholder: "큰 타이틀" })
        ),
        Dynamic.$("li").add(
            Dynamic.$("input", { id: "input-playlist-url", style: "width: 100%; margin-bottom: 8px;", placeholder: "YouTube URL" })
        ),
        Dynamic.$("button", { text: "➕ 추가", style: "color: white;", onclick: () => {
                const title = document.getElementById("input-main-title").value.trim();
                const url = document.getElementById("input-playlist-url").value.trim();

                if (!title || !url) {
                    pushSnackbar({ message: "모든 입력란을 채워주세요.", type: "error" });
                    return;
                }

                if (!playlistMap[title]) playlistMap[title] = {};
                playlistMap[title][url] = url;

                DataResource.Data.updateData("playlist", playlistMap);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
        }})
    )
    EntryLists = Dynamic.$("ul", { style: "display: none;" });
    EntryState = Dynamic.$("li", { class: "entry-status", style: "padding: 4px 8px; font-weight: bold; color: #999;" }).set({ text: `1 / ${YConfig.entries.length}` });
    ListHeader = Dynamic.$("div", { class: "ytv-list-header ytv-has-playlists" });
    const listItems = Dynamic.$("div", { class: "ytv-list-inner" }).add(PlayLists, EntryLists)

    ListHeader.add(
        Dynamic.$("a", { href: "#", onclick: e => {
            e.preventDefault();
            const showEntries = ListHeader.node.classList.toggle("ytv-playlist-open");

            PlayLists.set({ style: showEntries ? "display: none" : ""})
            EntryLists.set({ style: showEntries ? "" : "display: none"})
        }}).add(
            Dynamic.$("img", { src: "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s88-c-k-c0x00ffffff-no-rj" }),
            Dynamic.$("span", { class: "playlist-title-label" }).add(
                Dynamic.$("i", { class: "ytv-arrow down" }),
                TitleLabel
            )
        )
    )

    Object.keys(playlistMap).sort().forEach(title => {
        PlayLists.add(Dynamic.$("li", { class: "playlist-title", text: title }));

        Object.entries(playlistMap[title]).sort().forEach(([name, url]) => {
            PlayLists.add(Dynamic.$("li", { class: "playlist-item", onclick: async () => { 
                const apiKey = "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo";
                const playlistId = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
                const videoId = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];

                try {
                    if (playlistId) {
                        let items = [], pageToken = "";
                        while (items.length < 200) {
                            const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId[1]}&key=${apiKey}&part=snippet&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&fields=items(snippet(title,thumbnails,resourceId(videoId))),nextPageToken`);
                            const data = await res.json();

                            items.push(...data.items.map(item => ({
                                id: item.snippet.resourceId.videoId,
                                title: item.snippet.title,
                                img: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
                            })));

                            if (!data.nextPageToken) break;
                            pageToken = data.nextPageToken;
                        }

                        YConfig.entries = items;
                    } else {
                        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
                        const data = await res.json();
                        const video = data.items[0];
            
                        YConfig.entries = [{
                            id: video.id,
                            title: video.snippet.title,
                            img: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url
                        }];
                    }

                    YConfig.currentEntry = YConfig.entries[0];
                    YConfig.playbackPosition = 0;

                    loadPlaylist(YTPlayer, YConfig);
                } catch (err) { console.error("❌ API 호출 실패:", err); }
            }}).add(
                Dynamic.$("span", { class: "playlist-name", text: name }),
                Dynamic.$("span", { class: "playlist-buttons" }).add(
                    Dynamic.$("button", { class: "playerButton", text: "✏️", onclick: e => {
                        e.stopPropagation();
                        const newName = prompt("새 이름을 입력하세요", name);
                        if (!newName || newName === name) return;
                        if (playlistMap[title][newName]) {
                            pushSnackbar({ message: "해당 이름은 이미 존재합니다", type: "error" });
                            return;
                        }
                        playlistMap[title][newName] = playlistMap[title][name];
                        delete playlistMap[title][name];

                        DataResource.Data.updateData("playlist", playlistMap);
                        DataResource.Data.synchronize();
                        Dynamic.FragMutation.refresh();
                    }}),
                    Dynamic.$("button", { class: "playerButton", text: "❌", onclick: e => {
                        e.stopPropagation();
                        if (!confirm("정말로 삭제하시겠습니까?")) return;
                        delete playlistMap[title][name];
                        if (Object.keys(playlistMap[title]).length === 0) delete playlistMap[title];

                        DataResource.Data.updateData("playlist", playlistMap);
                        DataResource.Data.synchronize();
                        Dynamic.FragMutation.refresh();
                    }})
                )
            ))
        });
    });

    if (!YTPlayer) YTPlayer = new YT.Player("ytv-player", YTPlayerSettings);
    Dynamic.snipe(".ytv-list").reset(ListHeader, listItems)
});

export { restoreYConfig };
export default Player;
