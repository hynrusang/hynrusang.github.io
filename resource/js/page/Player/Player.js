import { Dynamic } from "../../init/module.js";
import { pushSnackbar } from "../../util/Tools.js";

let timeTracker = null;
let YConfig = {
    id: "v=C0DPdy98e4c",
    playTarget: null,
    playTime: 0
};

const loadPlaylist = (YTPlayer, playlist) => {
    let playIndex = playlist.findIndex(id => id === YConfig.playTarget);
    if (playIndex == -1) {
        playIndex = 0;
        YConfig.playTime = 0;
    }
    YTPlayer.loadPlaylist(playlist, playIndex, YConfig.playTime, "default");
    YTPlayer.setLoop(true);
};

const createPlayerTools = YTPlayer => Dynamic.$("div", {
    style: "position: absolute; left: 0px; bottom: 50%; display: flex; flex-direction: column;"
}).add(
    Dynamic.$("button", { class: "playerButton", text: "🔀", onclick: () => {
        loadPlaylist(YTPlayer, YTPlayer.getPlaylist().sort(() => Math.random() - 0.5));
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }}),

    Dynamic.$("button", { class: "playerButton", text: "🔁", onclick: () => {
        loadPlaylist(YTPlayer, YTPlayer.getPlaylist().reverse());
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }}),
    Dynamic.$("button", { class: "playerButton", text: "🎯", onclick: () => {
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

        const playlist = YTPlayer.getPlaylist();
        const indices = new Set();

        input.trim().split(/\s+/).forEach(token => {
            if (/^\d+$/.test(token)) {
                indices.add(+token);
            } else if (/^(\d+)[-~](\d+)$/.test(token)) {
                let [ , a, b ] = token.match(/^(\d+)[-~](\d+)$/);
                for (let i = Math.min(a = +a, b = +b); i <= Math.max(a, b); i++) indices.add(i);
            } else if (/^[-~](\d+)$/.test(token)) {
                for (let i = 1, end = +token.match(/^[-~](\d+)$/)[1]; i <= end; i++) indices.add(i);
            } else if (/^(\d+)[-~]$/.test(token)) {
                for (let i = +token.match(/^(\d+)[-~]$/)[1]; i <= playlist.length; i++) indices.add(i);
            }
        });

        const parsed = [...indices].map(n => playlist[n - 1]).filter(Boolean);

        if (!parsed.length) {
            pushSnackbar({ message: "입력한 번호가 재생목록에 존재하지 않거나 잘못되었습니다.", type: "error" });
            return;
        }

        loadPlaylist(YTPlayer, parsed);
        pushSnackbar({ message: `선택한 ${parsed.length}개의 영상으로 반복 재생을 시작합니다.`, type: "normal" });
    }})
);

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(() => {
    const playlistId = YConfig.id.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const videoId = YConfig.id.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    let playerConfig = {
        events: {
            onReady: e => {
                if (playlistId) {
                    Dynamic.snipe("fragment[rid=player]").add(createPlayerTools(e.target));
                    loadPlaylist(e.target, e.target.getPlaylist());
                } else e.target.playVideo();
            },
            onError: e => {
                pushSnackbar({message: playlistId ? "재생할 수 없는 동영상을 건너뛰었습니다." : "재생할 수 없는 동영상입니다.", type: "error"});
                if (playlistId) e.target.playVideoAt((e.target.getPlaylistIndex() + 1) % e.target.getPlaylist().length);
            }
        }
    }

    if (playlistId) {
        playerConfig.playerVars = {
            listType: "playlist",
            list: playlistId[1],
            index : 0,
        }
        playerConfig.events.onStateChange = e => {
            if (e.data === YT.PlayerState.PLAYING) {
                cancelAnimationFrame(timeTracker);
                YConfig.playTarget = e.target.getVideoData().video_id;
                timeTracker = requestAnimationFrame(function update() {
                    YConfig.playTime = e.target.getCurrentTime();
                    timeTracker = requestAnimationFrame(update);
                });
            } else if ([YT.PlayerState.PAUSED, YT.PlayerState.ENDED, YT.PlayerState.BUFFERING].includes(e.data)) cancelAnimationFrame(timeTracker);
        }
    } else {
        playerConfig.videoId = videoId;
        playerConfig.events.onStateChange = e => e.data === YT.PlayerState.ENDED && e.target.playVideo();
    }
    new YT.Player("dynamic_player", playerConfig);
});

export { YConfig };
export default Player;
