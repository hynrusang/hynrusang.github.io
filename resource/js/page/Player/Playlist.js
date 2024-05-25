import { Dynamic } from "../../init/module.js";
import { PlaylistForm } from "../../component/FormBox.js";
import { HandlerX, IconX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import Player from "./Player.js";

const Playlist = new Dynamic.Fragment("player",
    ScreenX("dynamic_playlist").add(PlaylistForm)
).registAction(() => {
    Dynamic.snipe("#dynamic_playlist").reset()
    const temp = DataResource.Data.basic.playlist
    Object.keys(temp).sort().forEach(key => {
        Dynamic.snipe("#dynamic_playlist").add(
            Dynamic.$("div", {style: "flex-direction: column", class: "handlerX"}).add(
                Dynamic.$("div", {style: "display: flex"}).add(
                    Dynamic.$("h4", {style: "width: 100%", text: key}),
                    IconX({icon: "delete", onclick: () => {
                        if (confirm("정말로 해당 큰 타이틀을 지우시겠습니까?")) {
                            delete temp[key];
                            if (DataResource.Data.updateData({key: "playlist", value: temp})) DataResource.Data.synchronize();
                            Dynamic.FragMutation.refresh();
                        }
                    }})
                ),
                Object.keys(temp[key]).sort().map(subkey => HandlerX({
                    element: Dynamic.$("a", {text: subkey, href: temp[key][subkey], onclick: e => {
                        e.preventDefault();
                        Dynamic.FragMutation.mutate(Player, {
                            title: `${key}: ${subkey}`,
                            url: temp[key][subkey]
                        });
                    }}),
                    onedit: e => {
                        e.preventDefault();
                        temp[key][e.target[0].value] = temp[key][subkey];
                        if (e.target[0].value != subkey) delete temp[key][subkey];
                        if (DataResource.Data.updateData({key: "playlist", value: temp})) DataResource.Data.synchronize();
                        Dynamic.FragMutation.refresh();
                    },
                    ondelete: () => {
                        if (confirm("정말로 해당 영상 / 재생목록을 삭제하시겠습니까?")) {
                            delete temp[key][subkey];
                            if (DataResource.Data.updateData({key: "playlist", value: temp})) DataResource.Data.synchronize();
                            Dynamic.FragMutation.refresh();
                        }
                    }
                })),
            )
        )
    })
});

export default Playlist;
