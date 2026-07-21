/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-changelog",
factory: function (require) {
"use strict";var plugin=(()=>{var fe=Object.create;var j=Object.defineProperty;var ue=Object.getOwnPropertyDescriptor;var Ee=Object.getOwnPropertyNames;var ye=Object.getPrototypeOf,Ce=Object.prototype.hasOwnProperty;var E=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var Ne=(e,t)=>{for(var n in t)j(e,n,{get:t[n],enumerable:!0})},ne=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let p of Ee(t))!Ce.call(e,p)&&p!==n&&j(e,p,{get:()=>t[p],enumerable:!(r=ue(t,p))||r.enumerable});return e};var J=(e,t,n)=>(n=e!=null?fe(ye(e)):{},ne(t||!e||!e.__esModule?j(n,"default",{value:e,enumerable:!0}):n,e)),Pe=e=>ne(j({},"__esModule",{value:!0}),e);var Be={};Ne(Be,{default:()=>Le});var ge=E("@yarnpkg/cli"),L=E("@yarnpkg/core"),f=E("@yarnpkg/fslib"),F=E("clipanion");var se=J(E("fs"));function oe(e,t){try{let n=se.default.readFileSync(e,"utf8"),r=JSON.parse(n),p=JSON.parse(t),a={...r.dependencies,...r.devDependencies},l={...p.dependencies,...p.devDependencies},c={},o={};for(let[i,m]of Object.entries(a))l[i]?l[i]!==m&&(o[i]=m):c[i]=m;return{added:c,updated:o}}catch(n){return console.warn("Warning: Failed to parse package.json for diffing:",n),{added:{},updated:{}}}}var O=J(E("fs")),G=J(E("path")),re=E("child_process");function X(e,t,n){let r=`## [${t}] - ${n}

`,p=e.sections.map(a=>a.isEmpty?"":`### ${a.name}
${a.content.trim()}

`).join("");if(r+=p,e.includeDependencies&&e.upstreamBranch)try{let a=process.cwd(),l=G.default.join(a,"package.json");if(!O.default.existsSync(l)){let o=O.default.readdirSync(process.cwd()).filter(i=>O.default.lstatSync(G.default.join(process.cwd(),i)).isDirectory()).find(i=>i.includes(e.packageName.split("/").pop()||""));o&&(a=G.default.join(process.cwd(),o),l=G.default.join(a,"package.json"))}if(O.default.existsSync(l)){let c=e.upstreamBranch,o=(0,re.execSync)(`git show ${c}:${l}`,{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).toString(),{added:i,updated:m}=oe(l,o);if(Object.keys(i).length>0||Object.keys(m).length>0){let d=Object.entries({...i,...m}).sort((h,u)=>h[0].localeCompare(u[0])).map(([h,u])=>`- ${h}@${u}`).join(`
`);r+=`## \u{1F4E6} Dependencies
${d}

`}}else console.warn(`Warning: Could not find package.json for ${e.packageName} at ${l}. Skipping dependency section.`)}catch{console.warn(`Warning: Failed to retrieve upstream dependencies for ${e.packageName} from branch ${e.upstreamBranch}. Skipping section.`)}return r}var ie={heading:1,other:2,list:3};function Re(e){let t=e.trim();if(!t)return"other";let n=t.split(`
`)[0].trim();return/^#{2,}/.test(n)?"heading":/^[-*+]/.test(n)||/^\d+\./.test(n)?"list":"other"}function De(e){let t=e.trim();return/^[-*+]/.test(t)||/^\d+\./.test(t)}function ae(e){if(e.length===0)return"";let t=e.map(a=>({content:a.trim(),type:Re(a)}));t.sort((a,l)=>ie[a.type]-ie[l.type]);let n=t.filter(a=>a.type!=="list"),r=t.filter(a=>a.type==="list"),p=[];for(let a of n)p.push(a.content);if(r.length>0){let a=[];for(let l of r){let c=l.content.split(`
`);for(let o of c)o.trim()&&(De(o)||/^\s+/.test(o))&&a.push(o)}a.length>0&&p.push(a.join(`
`))}return p.join(`

`)}var ce={major:3,minor:2,patch:1};function q(e){if(e.length===0)return{packageName:"",versionType:"patch",sections:[],hasPlaceholders:!1};if(e.length===1)return e[0];let{packageName:t}=e[0],n=e.some(c=>c.hasPlaceholders),r=e.reduce((c,o)=>{let i=ce[o.versionType]??0,m=ce[c]??0;return i>m?o.versionType:c},"patch"),p=new Map,a=[];for(let c of e)for(let o of c.sections){p.has(o.name)||(p.set(o.name,[]),a.push(o.name));let i=o.content.trim();if(!i)continue;let m=p.get(o.name);m.some(d=>d.trim().toLowerCase()===i.toLowerCase())||m.push(i)}let l=a.map(c=>{let o=p.get(c)??[],i=ae(o);return{name:c,content:i?`${i}
`:"",isEmpty:!i}});return{packageName:t,versionType:r,sections:l,hasPlaceholders:n}}var s={BREAKING_CHANGES:"\u{1F4A5} Breaking Changes",DEPRECATED:"\u{1F5D1}\uFE0F Deprecated",FEATURES:"\u2728 Features",BUG_FIXES:"\u{1F41B} Bug Fixes",DOCUMENTATION:"\u{1F4DA} Documentation",PERFORMANCE:"\u26A1 Performance",REFACTORING:"\u267B\uFE0F Refactoring",TESTS:"\u{1F9EA} Tests",BUILD:"\u{1F4E6} Build",CI:"\u{1F477} CI",DEPENDENCIES:"\u2B06\uFE0F Dependencies",CHORES:"\u{1F527} Chores"};function _(e,t={}){let n=[];return t.expectedVersionType&&e.versionType!==t.expectedVersionType&&n.push(`Version type mismatch: changelog has "${e.versionType}" but manifest expects "${t.expectedVersionType}". Run 'yarn changelog create --force' to regenerate.`),e.versionType==="major"&&!e.sections.some(p=>p.name===s.BREAKING_CHANGES&&!p.isEmpty)&&n.push(`Major release requires filled "${s.BREAKING_CHANGES}" section`),e.sections.filter(p=>!p.isEmpty).length===0&&n.push("At least one section must have content"),n}function pe(e,t){let n=[];return e||n.push(`${t}: Missing package name heading. Expected a heading like "# @furystack/package-name" at the start of the file.`),{isValid:n.length===0,errors:n}}function le(e,t){let n=e.versionType!==t,p=_(e,{expectedVersionType:t}).filter(a=>!a.includes("Version type mismatch"));return{shouldRegenerate:n||p.length>0,hasVersionMismatch:n,contentErrors:p}}var we="patch",xe="<!-- PLACEHOLDER:",Te=/<!-- version-type: (\w+) -->/,Se=/^# (.+)$/m,ke=/^## (.+)$/;function k(e){let t=e.split(`
`),r=e.match(Te)?.[1]??we,a=e.match(Se)?.[1]??"",l=e.includes(xe),c=[],o=null;for(let i of t){let m=i.match(ke);m?(o&&c.push(o),o={name:m[1],content:"",isEmpty:!0}):o&&!i.trim().startsWith("<!--")&&(o.content+=`${i}
`,i.trim()&&(o.isEmpty=!1))}return o&&c.push(o),{packageName:a,versionType:r,sections:c,hasPlaceholders:l}}var b=".yarn/changelogs",M=".yarn/versions";var Q="0.0.0",Z="# Changelog",V=class extends ge.BaseCommand{static paths=[["changelog","apply"]];static usage=F.Command.Usage({description:"Apply changelog entries to package CHANGELOG.md files",details:`
      This command:
      - Reads all changelog drafts from \`.yarn/changelogs/\`
      - Groups entries by package name
      - Prepends new entries to each package's CHANGELOG.md
      - Deletes processed draft files
    `,examples:[["Apply changelogs","yarn changelog apply"]]});verbose=F.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});dryRun=F.Option.Boolean("--dry-run",!1,{description:"Show what would be done without making changes"});async execute(){let t=await L.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await L.Project.find(t,this.context.cwd),r=f.ppath.join(n.cwd,b);if(this.dryRun&&this.context.stdout.write(`[DRY RUN] No changes will be made.

`),!await f.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/changelogs directory found. Nothing to apply.
`),0;let a=(await f.xfs.readdirPromise(r)).filter(d=>d.endsWith(".md"));if(a.length===0)return this.context.stdout.write(`No changelog drafts found. Nothing to apply.
`),0;let l=[],c=[];for(let d of a){let h=f.ppath.join(r,d),u=await f.xfs.readFilePromise(h,"utf8"),g=k(u),C=pe(g.packageName,d);if(!C.isValid){c.push(...C.errors);continue}l.push({path:h,filename:d,packageName:g.packageName,content:u})}if(c.length>0){this.context.stderr.write(`Validation errors found:
`);for(let d of c)this.context.stderr.write(`  \u2717 ${d}
`);this.context.stderr.write(`
Invalid drafts were skipped and not deleted.

`)}let o=new Map;for(let d of l){let h=o.get(d.packageName)??[];h.push(d),o.set(d.packageName,h)}let i=new Date().toISOString().split("T")[0],m=0;for(let[d,h]of o){let u=n.workspaces.find(N=>N.manifest.raw.name===d),g,C;if(u)g=u.cwd,C=u.manifest.version??Q;else{let N=d.replace(/^@[^/]+\//,"");g=f.ppath.join(n.cwd,`packages/${N}`);let $=f.ppath.join(g,"package.json");await f.xfs.existsPromise($)?C=JSON.parse(await f.xfs.readFilePromise($,"utf8")).version??Q:C=Q}if(!await f.xfs.existsPromise(g))throw new Error(`Package directory not found: ${g}
Package '${d}' has changelog entries but no workspace directory exists.
This may indicate the package was deleted or uses a non-standard directory structure.`);let R=f.ppath.join(g,"CHANGELOG.md"),D="";await f.xfs.existsPromise(R)&&(D=await f.xfs.readFilePromise(R,"utf8"));let A=h.map(N=>k(N.content)),I=q(A),P=X(I,C,i),T,S=new RegExp(`^${Z}(?:\\r?\\n)+`);if(D){let N=D.match(S);if(N){let $=N[0].length;T=D.slice(0,$)+P+D.slice($)}else T=`${Z}

${P}${D}`}else T=`${Z}

${P}`;if(this.context.stdout.write(`Applying ${h.length} entry(ies) to ${d}
`),this.dryRun){if(this.verbose){this.context.stdout.write(`  Would write to: ${R}
`);for(let N of h)this.context.stdout.write(`  Would delete: ${N.filename}
`)}}else{await f.xfs.writeFilePromise(R,T);for(let N of h)await f.xfs.unlinkPromise(N.path),this.verbose&&this.context.stdout.write(`  Deleted: ${N.filename}
`)}m+=h.length}let x=this.dryRun?"Would apply":"Applied";return this.context.stdout.write(`
${x} ${m} changelog entry(ies) to ${o.size} package(s).
`),c.length>0?1:0}};var me=E("@yarnpkg/cli"),K=E("@yarnpkg/core"),w=E("@yarnpkg/fslib"),W=E("clipanion");function ve(e){return e==="patch"||e==="minor"||e==="major"}function B(e,t){let n=[],r=e.split(`
`),p=!1;for(let a of r){let l=a.trim();if(l==="releases:"){p=!0;continue}if(p&&l){let c=l.match(/^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/);if(c){let o=c[1],i=c[2];ve(i)&&n.push({packageName:o,versionType:i})}}}return{id:be(t),path:t,releases:n}}function de(e){return e.replace(/\//g,"-")}function be(e){return(e.split("/").pop()??"").replace(".yml","")}var Ae="Updated dependencies",Ie=`<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->`,$e={[s.BREAKING_CHANGES]:"Describe breaking changes (BREAKING CHANGE:)",[s.DEPRECATED]:"Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag.",[s.FEATURES]:"Describe your shiny new features (feat:)",[s.BUG_FIXES]:"Describe the nasty little bugs that has been eradicated (fix:)",[s.DOCUMENTATION]:"Describe documentation changes (docs:)",[s.PERFORMANCE]:"Describe performance improvements (perf:)",[s.REFACTORING]:"Describe code refactoring (refactor:)",[s.TESTS]:"Describe test changes (test:)",[s.BUILD]:"Describe build system changes (build:)",[s.CI]:"Describe CI configuration changes (ci:)",[s.DEPENDENCIES]:"Describe dependency updates (deps:)",[s.CHORES]:"Describe other changes (chore:)"},Oe="<!-- MIGRATION REQUIRED: Explain how to migrate from the previous version -->",Ge=[s.BREAKING_CHANGES,s.DEPRECATED,s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES],Fe=[s.DEPRECATED,s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES],je=[s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES];function _e(e,t=!1){let n=$e[e],r=`## ${e}
<!-- PLACEHOLDER: ${n} -->`;return t&&(r+=`
${Oe}`),r}function Me(e){return(e==="major"?Ge:e==="minor"?Fe:je).map(n=>{let r=n===s.BREAKING_CHANGES;return _e(n,r)}).join(`

`)}function ee(e,t){let n=Me(t);return`<!-- version-type: ${t} -->
# ${e}

${Ie}

${n}
`}function H(e,t){return`${de(e)}.${t}.md`}function te(e,t,n){let r=n||Ae;return t==="major"?`<!-- version-type: ${t} -->
# ${e}

## ${s.BREAKING_CHANGES}
- ${r}

## ${s.DEPENDENCIES}
- ${r}
`:`<!-- version-type: ${t} -->
# ${e}

## ${s.DEPENDENCIES}
- ${r}
`}var U=class extends me.BaseCommand{static paths=[["changelog","check"]];static usage=W.Command.Usage({description:"Validate changelog entries for all version manifests",details:`
      This command validates that:
      - Every release in \`.yarn/versions/*.yml\` has a changelog file
      - Major releases have filled BREAKING CHANGES sections
      - At least one section (Added/Changed/Fixed) has content
    `,examples:[["Validate changelogs","yarn changelog check"]]});verbose=W.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});async execute(){let t=await K.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await K.Project.find(t,this.context.cwd),r=w.ppath.join(n.cwd,M),p=w.ppath.join(n.cwd,b);if(!await w.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to check.
`),0;let l=(await w.xfs.readdirPromise(r)).filter(i=>i.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to check.
`),0;let c=[],o=0;for(let i of l){let m=w.ppath.join(r,i),x=await w.xfs.readFilePromise(m,"utf8"),d=B(x,m);this.verbose&&this.context.stdout.write(`Checking manifest: ${i}
`);for(let h of d.releases){let u=H(h.packageName,d.id),g=w.ppath.join(p,u);if(!await w.xfs.existsPromise(g)){c.push(`Missing changelog for ${h.packageName} (manifest: ${d.id}). Run 'yarn changelog create' to generate it.`);continue}let C=await w.xfs.readFilePromise(g,"utf8"),R=k(C),D=_(R,{expectedVersionType:h.versionType});if(D.length>0)for(let A of D)c.push(`${h.packageName} (${u}): ${A}`);else this.verbose&&this.context.stdout.write(`  \u2713 ${h.packageName}
`);o++}}if(c.length>0){this.context.stderr.write(`
Changelog validation failed:

`);for(let i of c)this.context.stderr.write(`  \u2717 ${i}
`);return this.context.stderr.write(`
Found ${c.length} error(s).
`),1}return this.context.stdout.write(`
\u2713 All ${o} changelog(s) are valid.
`),0}};var he=E("@yarnpkg/cli"),Y=E("@yarnpkg/core"),y=E("@yarnpkg/fslib"),v=E("clipanion");var z=class extends he.BaseCommand{static paths=[["changelog","create"]];static usage=v.Command.Usage({description:"Generate changelog drafts from version manifests",details:`
      This command reads all version manifests in \`.yarn/versions/*.yml\`
      and generates draft changelog files in \`.yarn/changelogs/\`.

      Each draft includes sections for Added, Changed, and Fixed entries.
      For major/minor releases, additional sections are included.

      Existing changelog drafts are not overwritten unless --force is used.

      Use --dependabot to auto-fill changelogs for dependency updates.
      The --message option can provide a custom message (e.g., PR title).
    `,examples:[["Generate changelog drafts","yarn changelog create"],["Regenerate mismatched/invalid changelogs","yarn changelog create --force"],["Generate for Dependabot PR","yarn changelog create --dependabot"],["Generate with custom message",'yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"']]});verbose=v.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});force=v.Option.Boolean("-f,--force",!1,{description:"Regenerate changelogs with mismatched version types or invalid entries"});dependabot=v.Option.Boolean("--dependabot",!1,{description:"Auto-fill changelog for dependency updates (Dependabot PRs)"});message=v.Option.String("-m,--message",{description:"Custom message for the changelog entry (used with --dependabot)"});async execute(){let t=await Y.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await Y.Project.find(t,this.context.cwd),r=y.ppath.join(n.cwd,M),p=y.ppath.join(n.cwd,b);if(await y.xfs.mkdirPromise(p,{recursive:!0}),!await y.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to do.
`),0;let l=(await y.xfs.readdirPromise(r)).filter(x=>x.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to do.
`),0;let c=0,o=0,i=0;for(let x of l){let d=y.ppath.join(r,x),h=await y.xfs.readFilePromise(d,"utf8"),u=B(h,d);this.verbose&&this.context.stdout.write(`Processing manifest: ${x}
`);for(let g of u.releases){let C=H(g.packageName,u.id),R=y.ppath.join(p,C);if(await y.xfs.existsPromise(R)){let A=await y.xfs.readFilePromise(R,"utf8"),I=k(A),P=le(I,g.versionType);if(this.force&&P.shouldRegenerate){let T=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await y.xfs.writeFilePromise(R,T);let S=[];P.hasVersionMismatch&&S.push(`${I.versionType} \u2192 ${g.versionType}`),P.contentErrors.length>0&&S.push(...P.contentErrors),this.context.stdout.write(`  Regenerated: ${C} (${S.join(", ")})
`),o++;continue}if(this.verbose)if(P.shouldRegenerate){let T=[];P.hasVersionMismatch&&T.push(`version mismatch: ${I.versionType} vs ${g.versionType}`),P.contentErrors.length>0&&T.push(...P.contentErrors.map(S=>S.toLowerCase())),this.context.stdout.write(`  Skipping ${g.packageName} (${T.join("; ")}, use --force to regenerate)
`)}else this.context.stdout.write(`  Skipping ${g.packageName} (already exists)
`);i++;continue}let D=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await y.xfs.writeFilePromise(R,D),this.context.stdout.write(`  Created: ${C} (${g.versionType})
`),c++}}let m=[`Created ${c}`];return o>0&&m.push(`regenerated ${o}`),m.push(`skipped ${i}`),this.context.stdout.write(`
Done! ${m.join(", ")} changelog draft(s).
`),0}};var Ve={commands:[z,U,V]},Le=Ve;return Pe(Be);})();
return plugin;
}
};
