import { Dynamic } from "./module.js";
import DataResource from "../util/DataResource.js";
import Login from "../page/Login.js";
import Userinfo from "../page/Setting/Userinfo.js"
import Link from "../page/Note/Link.js";
import Playlist from "../page/Player/Playlist.js";

DataResource.init();
DataResource.Data.navigator.user = {
    label: "유저 데이터 관련",
    page: Userinfo
}
DataResource.Data.navigator.note = {
    label: "텍스트 데이터 관련",
    page: Link
}
DataResource.Data.navigator.player = {
    label: "유튜브 플레이어 관련",
    page: Playlist
}
Dynamic.FragMutation.mutate(Login)
