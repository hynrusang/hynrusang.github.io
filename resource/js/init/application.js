import { Dynamic } from "./module.js";
import { AuthManagement, DBManagement, ThemeManagement } from "../util/Management.js";
import Login from "../page/Login.js";
import Memo from "../page/Note/Memo.js";
import Playlist from "../page/Player/Playlist.js";

AuthManagement.init();
ThemeManagement.init();
DBManagement.navigator.note = {
    label: "텍스트 데이터 관련",
    page: Memo
}
DBManagement.navigator.player = {
    label: "유튜브 플레이어 관련",
    page: Playlist
}
Dynamic.FragMutation.mutate(Login)