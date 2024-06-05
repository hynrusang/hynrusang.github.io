import { Dynamic } from "../../init/module.js";
import { ScreenX } from "../../component/XBox.js";
import { pushSnackbar } from "../../util/Tools.js";

const Player = new Dynamic.Fragment("player",
    Dynamic.$("div", {id: "dynamic_player"})
).registAction(playerUrl => {
    if (playerUrl) {
        let shuffleState = false;
        const parser = playerUrl.match(/list=([^&]+)/);
        const createShuffleButton = YTPlayer => Dynamic.$("button", {class: "iconX", style: "position: absolute; left: 0px; bottom: 50%; background-image: url(/resource/img/icon/shuffle.png); opacity: 0.5", onclick: e => {
            YTPlayer.setShuffle(shuffleState = !shuffleState);
            pushSnackbar({message: `셔플 모드를 ${shuffleState ? "" : "비"}활성화 시켰습니다.`, type: "normal"});
            e.target.style.opacity = shuffleState ? null : "0.5"
        }})

        new YT.Player("dynamic_player", {
            playerVars: parser ? {
                listType: 'playlist',
                list: parser[1]
            } : null,
            videoId: !parser ? playerUrl.match(/v=([^&]+)/)[1] : null,
            events: {
                'onReady': e => {
                    e.target.playVideo();
                    if (parser) Dynamic.snipe("fragment[rid=player]").add(createShuffleButton(e.target));
                },
                'onStateChange': e => {
                    if (e.data === YT.PlayerState.ENDED) {
                        if (parser && shuffleState && e.target.getPlaylistIndex() === e.target.getPlaylist().length - 1) e.target.setShuffle(true);
                        e.target.playVideoAt(0);
                    } 
                },
                'onError': e => {
                    switch (e.data) {
                        case 2:
                            pushSnackbar({message: "잘못된 동영상 ID입니다.", type: "error"});
                            break;
                        case 5:
                            pushSnackbar({message: "이 브라우저는 플레이어를 실행할 수 없습니다.", type: "error"});
                            break;
                        case 100:
                            pushSnackbar({message: "이 동영상은 삭제되거나 비공개 처리 되어있습니다.", type: "error"});
                            break;
                        case 101:
                            pushSnackbar({message: "이 동영상은 유튜브 내부에서만 재생 가능합니다.", type: "error"});
                            break;
                        case 150:
                            pushSnackbar({message: "이 동영상은 해당 국가에서 재생할 수 없습니다.", type: "error"});
                            break;
                        default:
                            pushSnackbar({message: e.data, type: "error"});
                            break;
                    }
                    if (parser) e.target.playVideoAt((e.target.getPlaylistIndex() + 1) % e.target.getPlaylist().length);
                }
            }
        })
    }
});

export default Player;
