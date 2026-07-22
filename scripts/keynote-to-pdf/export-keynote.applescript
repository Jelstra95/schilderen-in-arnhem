-- Export a Keynote document to PDF.
-- Usage: osascript export-keynote.applescript <input.key> <output.pdf>
on run argv
	set inPath to item 1 of argv
	set outPath to item 2 of argv
	tell application "Keynote"
		open (POSIX file inPath)
		delay 0.7
		set theDoc to front document
		export theDoc to (POSIX file outPath) as PDF
		close theDoc saving no
	end tell
end run
