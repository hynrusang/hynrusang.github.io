import { Dynamic } from "../../init/module.js";
import { pushSnackbar } from "../../util/Tools.js";

let YConfig = {
    id: "v=C0DPdy98e4c",
    createPlayerTools: YTPlayer => Dynamic.$("div", {style: "position: absolute; left: 0px; bottom: 50%; display: flex; flex-direction: column;"}).add(
        Dynamic.$("button", {class: "iconX", style: "margin: 5px 0px; background-image: url(/resource/img/icon/shuffle.png);", onclick: () => {
            YTPlayer.setShuffle(true);
            pushSnackbar({message: "재생목록을 섞었습니다.", type: "normal"});
        }}),
        Dynamic.$("button", {class: "iconX", style: "margin: 5px 0px; background-image: url(/resource/img/icon/reverse.png);", onclick: () => {
            YTPlayer.loadPlaylist(YTPlayer.getPlaylist().reverse());
            YTPlayer.playVideoAt(0);
            YTPlayer.setLoop(true);
            pushSnackbar({message: "재생목록을 역순으로 재배치했습니다.", type: "normal"});
        }})
    )
}

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(() => {
    const match = YConfig.id.match(/(?:list=([a-zA-Z0-9_-]+))|(?:youtu\.be\/([a-zA-Z0-9_-]{11}))|(?:v=([a-zA-Z0-9_-]{11}))/);

    const playlistId = match?.[1] || null;
    const videoId = match?.[2] || match?.[3] || null;

    new YT.Player("dynamic_player", {
            playerVars: playlistId ? {
            listType: 'playlist',
            list: playlistId,
            loop: 1,
            controls: 1,
            modestbranding: 1
        } : null,
        videoId: videoId,
        events: {
            onStateChange: playlistId ? null : e => (e.data === YT.PlayerState.ENDED) && e.target.playVideo(),
            onReady: e => {
                e.target.playVideo();
                if (playlistId) Dynamic.snipe("fragment[rid=player]").add(YConfig.createPlayerTools(e.target));
            },
            onError: e => {
                pushSnackbar({message: playlistId ? "재생할 수 없는 동영상을 건너뛰었습니다." : "재생할 수 없는 동영상입니다.", type: "error"});
                if (playlistId) e.target.playVideoAt((e.target.getPlaylistIndex() + 1) % e.target.getPlaylist().length);
            }
        }
    });
});

export { YConfig };
export default Player;
