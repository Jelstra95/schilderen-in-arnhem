-- Export a Pages document to PDF.
-- Usage: osascript export-pages.applescript <input.pages> <output.pdf>
on run argv
	set inPath to item 1 of argv
	set outPath to item 2 of argv
	tell application "Pages"
		set theDoc to open (POSIX file inPath)
		delay 0.7
		export theDoc to (POSIX file outPath) as PDF
		close theDoc saving no
	end tell
end run
