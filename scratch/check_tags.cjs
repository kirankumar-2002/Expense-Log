
const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

const tags = [];
const tagPattern = /<(\/?)(section|main|div|button|aside|header|footer|nav|ul|li|span|motion\.[a-z]+|StatCard|NavItem|StatCard|NavItem|SignIn|SignUp|Line|Doughnut|AtSign|User|AtSign|User)\b/g;

lines.forEach((line, index) => {
    let match;
    const lineNum = index + 1;
    
    // Simple way to handle multi-line tags for self-closing check: 
    // This isn't perfect but better.
    let searchStart = 0;
    while ((match = tagPattern.exec(line)) !== null) {
        const isClosing = match[1] === '/';
        const tagName = match[2];

        if (isClosing) {
            if (tags.length === 0) {
                console.log(`Error: Unexpected closing tag </${tagName}> at line ${lineNum}`);
            } else {
                const last = tags.pop();
                if (last.tagName !== tagName) {
                    console.log(`Error: Mismatched tags. Expected </${last.tagName}> (from line ${last.lineNum}) but found </${tagName}> at line ${lineNum}`);
                    // Push back to try to recover
                    // tags.push(last); 
                }
            }
        } else {
            // Check if it's self-closing on the same line
            const tagEndIndex = line.indexOf('>', match.index);
            if (tagEndIndex !== -1) {
                const tagContent = line.substring(match.index, tagEndIndex);
                if (tagContent.trim().endsWith('/')) {
                    // console.log(`Self-closing: <${tagName}/> at line ${lineNum}`);
                    continue;
                }
            }
            
            // If we didn't find '>' on this line, we'll assume it's NOT self-closing 
            // OR it's self-closing on a future line. This is a limitation.
            // But most of these tags in this file are NOT self-closing except motion.div and NavItem.
            if (tagName === 'NavItem' || tagName === 'StatCard' || tagName === 'motion.div' || tagName === 'Line' || tagName === 'Doughnut') {
                 // Check if the next few lines have the closing />
                 let foundClosing = false;
                 for (let i = index; i < Math.min(index + 10, lines.length); i++) {
                     if (lines[i].includes('/>')) {
                         foundClosing = true;
                         break;
                     }
                 }
                 if (foundClosing) continue;
            }

            tags.push({ tagName, lineNum });
        }
    }
});

if (tags.length > 0) {
    console.log('Unclosed tags:');
    tags.reverse().forEach(t => console.log(`${t.tagName} at line ${t.lineNum}`));
} else {
    console.log('All tags balanced (within the tracked names)');
}
