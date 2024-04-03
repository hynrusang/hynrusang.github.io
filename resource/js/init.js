import Setting from "./page/Setting.js";
import Login from "./page/Login.js";
import Memo from "./page/Note/Memo.js";
import Playlist from "./page/Player/Playlist.js";
import { NoteRouter, PlayerRouter } from "./page/Router.js";
import { AuthManagement, DBManagement, ThemeManagement } from "./util/Management.js";

AuthManagement.init();
ThemeManagement.init();
DBManagement.navigator.setting = {
    label: "계정 설정",
    page: Setting
}
DBManagement.navigator.note = {
    label: "텍스트 데이터 관련",
    page: Memo,
    router: NoteRouter
}
DBManagement.navigator.player = {
    label: "유튜브 플레이어 관련",
    page: Playlist,
    router: PlayerRouter
}

Login.launch();
