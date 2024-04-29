import { IconX } from "../component/XBox.js";
import Navigation from "./Setting/Navigation.js";
import Userinfo from "./Setting/Userinfo.js";
import Memo from "./Note/Memo.js";
import Link from "./Note/Link.js";
import Playlist from "./Player/Playlist.js";
import Player from "./Player/Player.js";

const SettingRouter = [
    IconX({icon: "navigator", onclick: () => FragmentBox.toggle(Navigation)}),
    IconX({icon: "edit", onclick: () => FragmentBox.toggle(Userinfo)})
]

const MainRouter = [
    IconX({icon: "memo", onclick: () => FragmentBox.toggle(Memo)}),
    IconX({icon: "link", onclick: () => FragmentBox.toggle(Link)})
]

const PlayerRouter = [
    IconX({icon: "database", onclick: () => FragmentBox.toggle(Playlist)}),
    IconX({icon: "https://www.youtube.com/", onclick: () => FragmentBox.toggle(Player)})
]

export { SettingRouter, MainRouter, PlayerRouter };