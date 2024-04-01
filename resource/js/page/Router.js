import { IconX } from "../component/XBox.js";
import Link from "./Note/Link.js";
import Memo from "./Note/Memo.js";
import Player from "./Player/Player.js";
import Playlist from "./Player/Playlist.js";

const NoteRouter = [
    IconX({icon: "memo", onclick: () => Memo.launch()}),
    IconX({icon: "link", onclick: () => Link.launch()})
]

const PlayerRouter = [
    IconX({icon: "database", onclick: () => Playlist.launch()}),
    IconX({icon: "https://www.youtube.com/", onclick: () => Player.launch()})
]

export { NoteRouter, PlayerRouter };