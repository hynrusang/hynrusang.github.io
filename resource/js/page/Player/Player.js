import { Dynamic } from "../../init/module.js";
import { ScreenX } from "../../component/XBox.js";
import { pushSnackbar } from "../../util/Tools.js";

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(playerUrl => {
    console.log(playerUrl)
    if (playerUrl) {
        let shuffleState = false;
        const parser = playerUrl.match(/list=([^&]+)/);
        const createShuffleButton = YTPlayer => Dynamic.$("button", {class: "iconX", style: "position: absolute; left: 0px; bottom: 50%; background-image: url(/resource/img/icon/shuffle.png); opacity: 0.5", onclick: e => {
            YTPlayer.setShuffle(shuffleState = !shuffleState);
            if (shuffleState) YTPlayer.playVideoAt(0);
            pushSnackbar({message: `셔플 모드를 ${shuffleState ? "" : "비"}활성화 시켰습니다.`, type: "normal"});
            e.target.style.opacity = shuffleState ? null : "0.5"
        }})

        if (parser) {
            new YT.Player("dynamic_player", {
                playerVars: {
                    listType: 'playlist',
                    list: parser[1]
                },
                events: {
                    'onReady': e => {
                        e.target.playVideo();
                        Dynamic.snipe("fragment[rid=player]").add(createShuffleButton(e.target));
                    },
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED && e.target.getPlaylistIndex() === e.target.getPlaylist().length - 1) {
                            if (shuffleState) e.target.setShuffle(true);
                            e.target.playVideoAt(0);
                        }
                    }
                }
            })
        } else {
            new YT.Player("dynamic_player", {
                videoId: playerUrl.match(/v=([^&]+)/)[1],
                events: {
                    'onReady': e => e.target.playVideo(),
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED) e.target.playVideo();
                    }
                }
            })
        }
    }
});

export default Player;