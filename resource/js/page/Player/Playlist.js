import { PlaylistForm } from "../../component/FormBox.js";
import { HandlerX, IconX, ScreenX } from "../../component/XBox.js";
import { DBManagement } from "../../util/Management.js";
import Player from "./Player.js";

const Playlist = new Fragment("player",
    ScreenX("dynamic_playlist").add(PlaylistForm)
).registAction(() => {
    snipe("#dynamic_playlist").reset()
    const temp = DBManagement.DB.basic.value("playlist")
    Object.keys(temp).sort().forEach(key => {
        snipe("#dynamic_playlist").add(
            $("div", {style: "flex-direction: column", class: "handlerX"}).add(
                $("div", {style: "display: flex"}).add(
                    $("h4", {style: "width: 100%", text: key}),
                    IconX({icon: "delete", onclick: () => {
                        if (confirm("정말로 해당 큰 타이틀을 지우시겠습니까?")) {
                            delete temp[key];
                            DBManagement.DB.basic.value("playlist", temp);
                            DBManagement.synchronize();
                            Fragment.refreshFragment();
                        }
                    }})
                ),
                Object.keys(temp[key]).sort().map(subkey => HandlerX({
                    element: $("a", {text: subkey, href: temp[key][subkey], onclick: e => {
                        e.preventDefault();
                        Player.launch({
                            title: `${key}: ${subkey}`,
                            url: temp[key][subkey]
                        })
                    }}),
                    onedit: e => {
                        e.preventDefault();
                        temp[key][e.target[0].value] = temp[key][subkey];
                        if (e.target[0].value != subkey) delete temp[key][subkey];
                        if (DBManagement.DB.basic.value("playlist", temp)) DBManagement.synchronize();
                        Fragment.refreshFragment();
                    },
                    ondelete: () => {
                        if (confirm("정말로 해당 영상 / 재생목록을 삭제하시겠습니까?")) {
                            delete temp[key][subkey];
                            DBManagement.DB.basic.value("playlist", temp);
                            DBManagement.synchronize();
                            Fragment.refreshFragment();
                        }
                    }
                })),
            )
        )
    })
});

export default Playlist;
