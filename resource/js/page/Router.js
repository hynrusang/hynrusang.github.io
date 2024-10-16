import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Memo from "./Note/Memo.js";
import Link from "./Note/Link.js";
import Playlist from "./Player/Playlist.js";
import Player from "./Player/Player.js";

const MainRouter = [
    IconX({icon: "link", onclick: () => Dynamic.FragMutation.mutate(Link)}),
    IconX({icon: "memo", onclick: () => Dynamic.FragMutation.mutate(Memo)})
]

const PlayerRouter = [
    IconX({icon: "database", onclick: () => Dynamic.FragMutation.mutate(Playlist)}),
    IconX({icon: "https://www.youtube.com/", onclick: () => Dynamic.FragMutation.mutate(Player)})
]

export { MainRouter, PlayerRouter };