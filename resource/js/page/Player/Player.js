import { Dynamic } from "../../init/module.js";
import { pushSnackbar } from "../../util/Tools.js";

let YConfig = {
    id: "v=C0DPdy98e4c",
}

const createPlayerTools = YTPlayer => Dynamic.$("div", {
    style: "position: absolute; left: 0px; bottom: 50%; display: flex; flex-direction: column;"
}).add(
    Dynamic.$("button", { class: "playerButton", text: "🔀", onclick: () => {
        YTPlayer.setShuffle(true);
        pushSnackbar({ message: "재생목록을 섞었습니다.", type: "normal" });
    }}),

    Dynamic.$("button", { class: "playerButton", text: "🔁", onclick: () => {
        YTPlayer.loadPlaylist(YTPlayer.getPlaylist().reverse());
        YTPlayer.setLoop(true);
        YTPlayer.playVideoAt(0);
        pushSnackbar({ message: "재생목록을 역순으로 재배치했습니다.", type: "normal" });
    }}),
    Dynamic.$("button", { class: "playerButton", text: "🎯", onclick: () => {
        const input = prompt(
            "재생할 영상 번호를 입력해 주세요 (띄어쓰기로 구분)\n\n" +
            "• 단일 번호 : 3 8 12\n" +
            "• 범위 입력 : 3~10 또는 3-10 (3~10번)\n" +
            "• 처음부터 : ~5 또는 -5 (1~5번)\n" +
            "• 끝까지   : 7~ 또는 7- (7~N번)\n\n" +
            "※ 단일 번호와 범위를 섞어 입력할 수 있습니다 (예: 2 5~8 11-)\n" +
            "※ '~' 또는 '-'는 숫자와 붙여 써야 합니다. 번호는 1번부터 시작합니다."
        );
        if (!input) return;

        const playlist = YTPlayer.getPlaylist();
        const max = playlist.length;
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
                for (let i = +token.match(/^(\d+)[-~]$/)[1]; i <= max; i++) indices.add(i);
            }
        });

        const parsed = Array.from(indices).map(n => playlist[n - 1]).filter(Boolean);

        if (!parsed.length) {
            pushSnackbar({ message: "입력한 번호가 재생목록에 존재하지 않거나 잘못되었습니다.", type: "error" });
            return;
        }

        YTPlayer.loadPlaylist(parsed);
        YTPlayer.setLoop(true);
        YTPlayer.playVideoAt(0);
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
                e.target.playVideo();
                if (playlistId) {
                    Dynamic.snipe("fragment[rid=player]").add(createPlayerTools(e.target));
                    e.target.loadPlaylist(e.target.getPlaylist());
                    e.target.setLoop(true);
                }
            },
            onError: e => {
                pushSnackbar({message: playlistId ? "재생할 수 없는 동영상을 건너뛰었습니다." : "재생할 수 없는 동영상입니다.", type: "error"});
                if (playlistId) e.target.playVideoAt((e.target.getPlaylistIndex() + 1) % e.target.getPlaylist().length);
            }
        }
    }

    if (playlistId) playerConfig.playerVars = {
        listType: "playlist",
        list: playlistId[1],
        index : 1,
    }
    else {
        playerConfig.videoId = videoId;
        playerConfig.events.onStateChange = e => e.data === YT.PlayerState.ENDED && e.target.playVideo();
    }
    new YT.Player("dynamic_player", playerConfig);
});

export { YConfig };
export default Player;
