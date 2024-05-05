import { Dynamic } from "../../init/module.js";
import { ScreenX } from "../../component/XBox.js";

const Player = new Dynamic.Fragment("player",
    ScreenX("dynamic_player").add(
        Dynamic.$("h1", {id: "title_player"})
    )
).registAction(playerInfo => {
    if (playerInfo) {
        Dynamic.snipe("#dynamic_player").reset(
            Dynamic.$("iframe", {src: `https://www.youtube.com/embed/${playerInfo.url.includes("list=") ? `videoseries/?list=${playerInfo.url.match(/[?&]list=([^&]+)/)[1]}&amp;loop=1&autoplay=1` : playerInfo.url.match(/[?&]v=([^&]+)/)}`, allowfullscreen: null})
        )
        Dynamic.scan("#title_player").innerText = playerInfo.title;
    }
});

export default Player;