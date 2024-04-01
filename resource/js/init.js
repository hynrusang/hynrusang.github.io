import Auth from "./page/Auth.js";
import Login from "./page/Login.js";
import Memo from "./page/Note/Memo.js";
import Playlist from "./page/Player/Playlist.js";
import { NoteRouter, PlayerRouter } from "./page/Router.js";
import { AuthManagement, DBManagement, ThemeManagement } from "./util/Management.js";

AuthManagement.init();
ThemeManagement.init();
DBManagement.navigator.setting = {
    label: "계정 설정",
    page: Auth
}
DBManagement.navigator.note = {
    label: "메모장",
    page: Memo,
    router: NoteRouter
}
DBManagement.navigator.player = {
    label: "유튜브 영상 / 재생목록 플레이어",
    page: Playlist,
    router: PlayerRouter
}

Login.launch();