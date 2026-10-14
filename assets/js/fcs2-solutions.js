// FrontierCS 2 problem pages: how a model's final submission solves the problem, in words, in place of its diff
// (owner, 2026-10-14). Keyed by the problem's short name; m is the model, steps are [title, text]. Written from the
// patch in assets/patches/<slug>.json (bin/fcs2_patches_from_platform.py). A problem with no entry shows no Solution section.
const SOLUTION = {
  "RAGEN": {m:'opus', steps:[
    ["Finding the turns", "The packed row is one chat: the system prompt, then the user and the model in turn. It counts the chat template’s turn-start tokens along the row, so every token knows which turn it belongs to. The loss mask covers everything after the system prompt, and the response mask covers only the model’s replies."],
    ["Placing the reward", "A game’s reward goes on its last token or, with rewards per turn, on the last token of each reply. Masks and rewards then shift by one token, so that each lines up with the token the model predicts."],
    ["Parsing replies", "Each reply goes to the repository’s own parser, with the configured separator and the limit on moves per turn."],
    ["Normalizing in groups", "Each game’s total reward, with any format penalty, is normalized within its group of games from the same start: the group mean is subtracted and the result divided by the group’s spread. A group whose rewards are all equal gets 0, so it teaches nothing."],
    ["A shorter history, its own idea", "The small model copies whatever earlier answer it sees, broken ones included. So a prompt keeps the previous turn only when that turn produced valid moves, and otherwise shows the current view alone. In its own offline Sokoban runs, this raised well-formed answers on later turns from about 45% to 75%, and solved games from 5.5% to 9.6%."],
  ]},
};
