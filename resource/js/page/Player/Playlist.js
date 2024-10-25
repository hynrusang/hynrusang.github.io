import { Dynamic } from "../../init/module.js";
import { PlaylistForm } from "../../component/FormBox.js";
import { HandlerContainerX, HandlerX, IconX, ScreenX } from "../../component/XBox.js";
import { pushSnackbar } from "../../util/Tools.js";
import DataResource from "../../util/DataResource.js";
import Player, { YConfig } from "./Player.js";

const Playlist = new Dynamic.Fragment("player",
    ScreenX("dynamic_playlist").add(PlaylistForm)
).registAction(() => {
    const temp = DataResource.Data.basic.playlist;
    Dynamic.snipe("#dynamic_playlist").reset(Object.keys(temp).sort().map(key => HandlerContainerX(
        HandlerX({
            element: Dynamic.$("h4", {text: key}),
            onedit: e => {
                e.preventDefault();
                if (temp[e.target[0].value]) {
                    pushSnackbar({message: "해당 큰 타이틀은 이미 존재합니다", type: "error"})
                    return;
                }
                temp[e.target[0].value] = temp[key];
                delete temp[key];
                DataResource.Data.updateData("playlist", temp);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
            },
            ondelete: () => {
                if (confirm("정말로 해당 큰 타이틀을 지우시겠습니까?")) {
                    delete temp[key];
                    DataResource.Data.updateData("playlist", temp);
                    DataResource.Data.synchronize();
                    Dynamic.FragMutation.refresh();
                }
            }
        }),
        Object.keys(temp[key]).sort().map(subkey => HandlerX({
            element: Dynamic.$("a", {text: subkey, href: temp[key][subkey], onclick: e => {
                e.preventDefault();
                YConfig.id = temp[key][subkey];
                Dynamic.FragMutation.mutate(Player);
            }}),
            onedit: e => {
                e.preventDefault();
                if (temp[key][e.target[0].value]) {
                    pushSnackbar({message: "해당 재생목록의 이름은 이미 존재합니다", type: "error"})
                    return;
                }
                temp[key][e.target[0].value] = temp[key][subkey];
                delete temp[key][subkey];
                DataResource.Data.updateData("playlist", temp);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
            },
            ondelete: () => {
                if (confirm("정말로 해당 영상 / 재생목록을 삭제하시겠습니까?")) {
                    delete temp[key][subkey];
                    DataResource.Data.updateData("playlist", temp);
                    DataResource.Data.synchronize();
                    Dynamic.FragMutation.refresh();
                }
            }
        }))
    )))
});

export default Playlist;
