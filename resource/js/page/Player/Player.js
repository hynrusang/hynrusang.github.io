import { Dynamic } from "../../init/module.js";
import { pushSnackbar } from "../../util/Tools.js";

let urlTemp = "v=C0DPdy98e4c"
const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(url => {
    let targetUrl = url ? (urlTemp = url) : urlTemp;
    const parser = targetUrl.match(/list=([^&]+)/);
    const createShuffleButton = YTPlayer => Dynamic.$("button", {class: "iconX", style: "position: absolute; left: 0px; bottom: 50%; background-image: url(/resource/img/icon/shuffle.png);", onclick: e => {
        YTPlayer.setShuffle(true);
        YTPlayer.playVideoAt(0);
        pushSnackbar({message: "재생목록을 섞었습니다.", type: "normal"});
    }})
    new YT.Player("dynamic_player", {
        playerVars: parser ? {
            listType: 'playlist',
            list: parser[1],
            loop: 1
        } : null,
        videoId: parser ? null : targetUrl.match(/v=([^&]+)/)[1],
        events: {
            onStateChange: parser ? null : e => (e.data === YT.PlayerState.ENDED) && e.target.playVideo(),
            onReady: e => {
                e.target.playVideo();
                if (parser) Dynamic.snipe("fragment[rid=player]").add(createShuffleButton(e.target));
            },
            onError: e => {
                pushSnackbar({message: parser ? "재생할 수 없는 동영상을 건너뛰었습니다." : "재생할 수 없는 동영상입니다.", type: "error"});
                if (parser) e.target.playVideoAt((e.target.getPlaylistIndex() + 1) % e.target.getPlaylist().length);
            }
        }
    })
});

export default Player;
