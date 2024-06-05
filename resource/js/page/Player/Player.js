import { Dynamic } from "../../init/module.js";
import { ScreenX } from "../../component/XBox.js";
import { pushSnackbar } from "../../util/Tools.js";

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(playerUrl => {
    if (playerUrl) {
        let player;
        let shuffleState = false;
        const parser = playerUrl.match(/list=([^&]+)/);

        if (parser) {
            player = new YT.Player("dynamic_player", {
                playerVars: {
                    listType: 'playlist',
                    list: parser[1]
                },
                events: {
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED && player.getPlaylistIndex() === player.getPlaylist().length - 1) {
                            player.playVideoAt(0);
                            if (shuffleState) player.setShuffle(true);
                        }
                    }
                }
            })
            Dynamic.snipe("fragment[rid=player]").add(
                Dynamic.$("input", {id: "player_shuffle", class: "iconX", style: "position: absolute; left: 0px; bottom: 50%; background-image: url(/resource/img/icon/shuffle.png); opacity: 0.5", type: "button", onclick: e => {
                    player.setShuffle(shuffleState = !shuffleState);
                    pushSnackbar({message: `셔플 모드를 ${shuffleState ? "" : "비"}활성화 시켰습니다.`, type: "normal"});
                    e.target.style.opacity = shuffleState ? null : "0.5"
                }})
            )
        } else {
            player = new YT.Player("dynamic_player", {
                videoId: playerUrl.match(/v=([^&]+)/)[1],
                events: {
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED) player.playVideo();
                    }
                }
            })
        }
    }
});

export default Player;