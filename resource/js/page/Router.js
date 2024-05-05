import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Navigation from "./Setting/Navigation.js";
import Userinfo from "./Setting/Userinfo.js";
import Memo from "./Note/Memo.js";
import Link from "./Note/Link.js";
import Playlist from "./Player/Playlist.js";
import Player from "./Player/Player.js";

const SettingRouter = [
    IconX({icon: "navigator", onclick: () => Dynamic.FragMutation.mutate(Navigation)}),
    IconX({icon: "edit", onclick: () => Dynamic.FragMutation.mutate(Userinfo)})
]

const MainRouter = [
    IconX({icon: "memo", onclick: () => Dynamic.FragMutation.mutate(Memo)}),
    IconX({icon: "link", onclick: () => Dynamic.FragMutation.mutate(Link)})
]

const PlayerRouter = [
    IconX({icon: "database", onclick: () => Dynamic.FragMutation.mutate(Playlist)}),
    IconX({icon: "https://www.youtube.com/", onclick: () => Dynamic.FragMutation.mutate(Player)})
]

export { SettingRouter, MainRouter, PlayerRouter };