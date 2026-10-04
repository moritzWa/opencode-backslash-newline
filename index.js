// Claude Code reads a \ before the cursor plus Enter as "insert a newline".
// OpenCode submits on Enter, so the same habit (or a keyboard macro built for
// Claude Code) sends the backslash as a message. This layer runs first and,
// only when the character before the cursor is \, deletes that backslash and
// inserts a newline instead, wherever the cursor is in the prompt.
const backslashBeforeCursor = (editor) => {
  const text = editor.plainText
  const offset = editor.cursorOffset
  if (typeof offset !== "number") return text.endsWith("\\")
  if (offset <= 0) return false
  // cursorOffset is a native buffer offset, which drifts from JS string
  // indices after emoji or other wide characters; getTextRange shares it.
  if (typeof editor.getTextRange === "function") return editor.getTextRange(offset - 1, offset) === "\\"
  return text[offset - 1] === "\\"
}

const plugin = {
  id: "backslash-newline",
  tui: async (api) => {
    api.keymap.registerLayer({
      mode: "base",
      commands: [
        {
          name: "backslash.newline",
          title: "Newline after backslash",
          hidden: true,
          run() {
            const editor = api.renderer.currentFocusedRenderable
            if (!editor || typeof editor.plainText !== "string" || typeof editor.newLine !== "function") {
              return false
            }
            if (!backslashBeforeCursor(editor)) return false
            if (typeof editor.deleteCharBackward === "function") editor.deleteCharBackward()
            else if (typeof editor.setText === "function" && editor.plainText.endsWith("\\")) {
              editor.setText(editor.plainText.slice(0, -1))
              if (typeof editor.gotoBufferEnd === "function") editor.gotoBufferEnd()
            } else return false
            editor.newLine()
            return true
          },
        },
      ],
      bindings: [{ key: "return", cmd: "backslash.newline", desc: "Newline when \\ is before the cursor" }],
    })
  },
}

export default plugin
