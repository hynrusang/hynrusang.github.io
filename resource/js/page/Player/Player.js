import { Dynamic } from "../../init/module.js";
import { ScreenX } from "../../component/XBox.js";
import { pushSnackbar } from "../../util/Tools.js";

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"}),
    Dynamic.$("input", {id: "player_shuffle", class: "iconX", style: "position: absolute; left: 0px; bottom: 50%; background-image: url(/resource/img/icon/shuffle.png)", type: "button"})
).registAction(playerUrl => {
    if (playerUrl) {
        let player;
        const parser = playerUrl.match(/list=([^&]+)/);

        if (parser) {
            player = new YT.Player("dynamic_player", {
                playerVars: {
                    listType: 'playlist',
                    list: parser[1]
                },
                events: {
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED && player.getPlaylistIndex() === player.getPlaylist().length - 1) player.playVideoAt(0);
                    }
                }
            })
            Dynamic.scan("#player_shuffle").onclick = () => {
                pushSnackbar({message: "재생목록을 섞었습니다.", type: "normal"})
                player.setShuffle(true);
            }
        } else {
            player = new YT.Player("dynamic_player", {
                videoId: playerUrl.match(/v=([^&]+)/)[1],
                events: {
                    'onStateChange': e => {
                        if (e.data === YT.PlayerState.ENDED) player.playVideo();
                    }
                }
            })
            Dynamic.scan("#player_shuffle").remove();
        }
    }
});

export default Player;