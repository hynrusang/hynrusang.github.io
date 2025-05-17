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
        const input = prompt("반복할 재생 인덱스를 입력하세요. (예: 3 8 24)");
        if (!input) return;

        const parsed = input.split(' ').map(s => YTPlayer.getPlaylist()[parseInt(s.trim())]).filter(Boolean);
        if (parsed.length === 0) {
            pushSnackbar({ message: "유효한 인덱스를 입력하세요.", type: "error" });
            return;
        }

        YTPlayer.loadPlaylist(parsed);
        YTPlayer.setLoop(true);
        YTPlayer.playVideoAt(0);
        pushSnackbar({ message: `지정된 인덱스의 영상들로 새롭게 재생목록을 로드합니다.`, type: "normal" });
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
                console.log(true);
                if (playlistId) Dynamic.snipe("fragment[rid=player]").add(createPlayerTools(e.target));
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
        loop: 1,
    }
    else {
        playerConfig.videoId = videoId;
        playerConfig.events.onStateChange = e => e.data === YT.PlayerState.ENDED && e.target.playVideo();
    }
    new YT.Player("dynamic_player", playerConfig);
});

export { YConfig };
export default Player;
