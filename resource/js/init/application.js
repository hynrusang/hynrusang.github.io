import { Dynamic } from "./module.js";
import DataResource from "../util/DataResource.js";
import Login from "../page/Login.js";
import Memo from "../page/Note/Memo.js";
import Playlist from "../page/Player/Playlist.js";

DataResource.init();
DataResource.Data.navigator.note = {
    label: "텍스트 데이터 관련",
    page: Memo
}
DataResource.Data.navigator.player = {
    label: "유튜브 플레이어 관련",
    page: Playlist
}
Dynamic.FragMutation.mutate(Login)