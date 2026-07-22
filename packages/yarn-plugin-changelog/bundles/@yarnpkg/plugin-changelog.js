/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-changelog",
factory: function (require) {
"use strict";var plugin=(()=>{var he=Object.create;var j=Object.defineProperty;var ue=Object.getOwnPropertyDescriptor;var Ee=Object.getOwnPropertyNames;var ye=Object.getPrototypeOf,Ce=Object.prototype.hasOwnProperty;var y=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var Ne=(e,t)=>{for(var n in t)j(e,n,{get:t[n],enumerable:!0})},ne=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let p of Ee(t))!Ce.call(e,p)&&p!==n&&j(e,p,{get:()=>t[p],enumerable:!(r=ue(t,p))||r.enumerable});return e};var J=(e,t,n)=>(n=e!=null?he(ye(e)):{},ne(t||!e||!e.__esModule?j(n,"default",{value:e,enumerable:!0}):n,e)),Pe=e=>ne(j({},"__esModule",{value:!0}),e);var Be={};Ne(Be,{default:()=>Le});var le=y("@yarnpkg/cli"),L=y("@yarnpkg/core"),u=y("@yarnpkg/fslib"),F=y("clipanion");var se=J(y("fs"));function oe(e,t){try{let n=se.default.readFileSync(e,"utf8"),r=JSON.parse(n),p=JSON.parse(t),i={...r.dependencies,...r.devDependencies},l={...p.dependencies,...p.devDependencies},a={},o={},c={};for(let[d,h]of Object.entries(i))l[d]?l[d]!==h&&(o[d]=h):a[d]=h;for(let[d,h]of Object.entries(l))i[d]||(c[d]=h);return{added:a,updated:o,removed:c}}catch(n){return console.warn("Warning: Failed to parse package.json for diffing:",n),{added:{},updated:{},removed:{}}}}var $=J(y("fs")),G=J(y("path")),re=y("child_process");function X(e,t,n){let r=`## [${t}] - ${n}

`,p=e.sections.map(i=>i.isEmpty?"":`### ${i.name}
${i.content.trim()}

`).join("");if(r+=p,e.includeDependencies&&e.upstreamBranch)try{let i=process.cwd(),l=G.default.join(i,"package.json");if(!$.default.existsSync(l)){let o=$.default.readdirSync(process.cwd()).filter(c=>$.default.lstatSync(G.default.join(process.cwd(),c)).isDirectory()).find(c=>c.includes(e.packageName.split("/").pop()||""));o&&(i=G.default.join(process.cwd(),o),l=G.default.join(i,"package.json"))}if($.default.existsSync(l)){let{upstreamBranch:a}=e,o=(0,re.execFileSync)("git",["show",`${a}:${l}`],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).toString(),{added:c,updated:d,removed:h}=oe(l,o);if(Object.keys(c).length>0||Object.keys(d).length>0||Object.keys(h).length>0){let f=Object.entries({...c,...d,...h}).sort((E,g)=>E[0].localeCompare(g[0])).map(([E,g])=>`- ${E}@${g}`).join(`
`);r+=`## \u{1F4E6} Dependencies
${f}

`}}else console.warn(`Warning: Could not find package.json for ${e.packageName} at ${l}. Skipping dependency section.`)}catch{console.warn(`Warning: Failed to retrieve upstream dependencies for ${e.packageName} from branch ${e.upstreamBranch}. Skipping section.`)}return r}var ie={heading:1,other:2,list:3};function Re(e){let t=e.trim();if(!t)return"other";let n=t.split(`
`)[0].trim();return/^#{2,}/.test(n)?"heading":/^[-*+]/.test(n)||/^\d+\./.test(n)?"list":"other"}function De(e){let t=e.trim();return/^[-*+]/.test(t)||/^\d+\./.test(t)}function ae(e){if(e.length===0)return"";let t=e.map(i=>({content:i.trim(),type:Re(i)}));t.sort((i,l)=>ie[i.type]-ie[l.type]);let n=t.filter(i=>i.type!=="list"),r=t.filter(i=>i.type==="list"),p=[];for(let i of n)p.push(i.content);if(r.length>0){let i=[];for(let l of r){let a=l.content.split(`
`);for(let o of a)o.trim()&&(De(o)||/^\s+/.test(o))&&i.push(o)}i.length>0&&p.push(i.join(`
`))}return p.join(`

`)}var ce={major:3,minor:2,patch:1};function q(e){if(e.length===0)return{packageName:"",versionType:"patch",sections:[],hasPlaceholders:!1};if(e.length===1)return e[0];let{packageName:t}=e[0],n=e.some(a=>a.hasPlaceholders),r=e.reduce((a,o)=>{let c=ce[o.versionType]??0,d=ce[a]??0;return c>d?o.versionType:a},"patch"),p=new Map,i=[];for(let a of e)for(let o of a.sections){p.has(o.name)||(p.set(o.name,[]),i.push(o.name));let c=o.content.trim();if(!c)continue;let d=p.get(o.name);d.some(m=>m.trim().toLowerCase()===c.toLowerCase())||d.push(c)}let l=i.map(a=>{let o=p.get(a)??[],c=ae(o);return{name:a,content:c?`${c}
`:"",isEmpty:!c}});return{packageName:t,versionType:r,sections:l,hasPlaceholders:n}}var s={BREAKING_CHANGES:"\u{1F4A5} Breaking Changes",DEPRECATED:"\u{1F5D1}\uFE0F Deprecated",FEATURES:"\u2728 Features",BUG_FIXES:"\u{1F41B} Bug Fixes",DOCUMENTATION:"\u{1F4DA} Documentation",PERFORMANCE:"\u26A1 Performance",REFACTORING:"\u267B\uFE0F Refactoring",TESTS:"\u{1F9EA} Tests",BUILD:"\u{1F4E6} Build",CI:"\u{1F477} CI",DEPENDENCIES:"\u2B06\uFE0F Dependencies",CHORES:"\u{1F527} Chores"};function _(e,t={}){let n=[];return t.expectedVersionType&&e.versionType!==t.expectedVersionType&&n.push(`Version type mismatch: changelog has "${e.versionType}" but manifest expects "${t.expectedVersionType}". Run 'yarn changelog create --force' to regenerate.`),e.versionType==="major"&&!e.sections.some(p=>p.name===s.BREAKING_CHANGES&&!p.isEmpty)&&n.push(`Major release requires filled "${s.BREAKING_CHANGES}" section`),e.sections.filter(p=>!p.isEmpty).length===0&&n.push("At least one section must have content"),n}function pe(e,t){let n=[];return e||n.push(`${t}: Missing package name heading. Expected a heading like "# @furystack/package-name" at the start of the file.`),{isValid:n.length===0,errors:n}}function ge(e,t){let n=e.versionType!==t,p=_(e,{expectedVersionType:t}).filter(i=>!i.includes("Version type mismatch"));return{shouldRegenerate:n||p.length>0,hasVersionMismatch:n,contentErrors:p}}var we="patch",xe="<!-- PLACEHOLDER:",Te=/<!-- version-type: (\w+) -->/,Se=/^# (.+)$/m,ke=/^## (.+)$/;function k(e){let t=e.split(`
`),r=e.match(Te)?.[1]??we,i=e.match(Se)?.[1]??"",l=e.includes(xe),a=[],o=null;for(let c of t){let d=c.match(ke);d?(o&&a.push(o),o={name:d[1],content:"",isEmpty:!0}):o&&!c.trim().startsWith("<!--")&&(o.content+=`${c}
`,c.trim()&&(o.isEmpty=!1))}return o&&a.push(o),{packageName:i,versionType:r,sections:a,hasPlaceholders:l}}var b=".yarn/changelogs",M=".yarn/versions";var Q="0.0.0",Z="# Changelog",V=class extends le.BaseCommand{static paths=[["changelog","apply"]];static usage=F.Command.Usage({description:"Apply changelog entries to package CHANGELOG.md files",details:`
      This command:
      - Reads all changelog drafts from \`.yarn/changelogs/\`
      - Groups entries by package name
      - Prepends new entries to each package's CHANGELOG.md
      - Deletes processed draft files
    `,examples:[["Apply changelogs","yarn changelog apply"]]});verbose=F.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});dryRun=F.Option.Boolean("--dry-run",!1,{description:"Show what would be done without making changes"});async execute(){let t=await L.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await L.Project.find(t,this.context.cwd),r=u.ppath.join(n.cwd,b);if(this.dryRun&&this.context.stdout.write(`[DRY RUN] No changes will be made.

`),!await u.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/changelogs directory found. Nothing to apply.
`),0;let i=(await u.xfs.readdirPromise(r)).filter(m=>m.endsWith(".md"));if(i.length===0)return this.context.stdout.write(`No changelog drafts found. Nothing to apply.
`),0;let l=[],a=[];for(let m of i){let f=u.ppath.join(r,m),E=await u.xfs.readFilePromise(f,"utf8"),g=k(E),N=pe(g.packageName,m);if(!N.isValid){a.push(...N.errors);continue}l.push({path:f,filename:m,packageName:g.packageName,content:E})}if(a.length>0){this.context.stderr.write(`Validation errors found:
`);for(let m of a)this.context.stderr.write(`  \u2717 ${m}
`);this.context.stderr.write(`
Invalid drafts were skipped and not deleted.

`)}let o=new Map;for(let m of l){let f=o.get(m.packageName)??[];f.push(m),o.set(m.packageName,f)}let c=new Date().toISOString().split("T")[0],d=0;for(let[m,f]of o){let E=n.workspaces.find(P=>P.manifest.raw.name===m),g,N;if(E)g=E.cwd,N=E.manifest.version??Q;else{let P=m.replace(/^@[^/]+\//,"");g=u.ppath.join(n.cwd,`packages/${P}`);let O=u.ppath.join(g,"package.json");await u.xfs.existsPromise(O)?N=JSON.parse(await u.xfs.readFilePromise(O,"utf8")).version??Q:N=Q}if(!await u.xfs.existsPromise(g))throw new Error(`Package directory not found: ${g}
Package '${m}' has changelog entries but no workspace directory exists.
This may indicate the package was deleted or uses a non-standard directory structure.`);let D=u.ppath.join(g,"CHANGELOG.md"),w="";await u.xfs.existsPromise(D)&&(w=await u.xfs.readFilePromise(D,"utf8"));let A=f.map(P=>k(P.content)),I=q(A),R=X(I,N,c),T,S=new RegExp(`^${Z}(?:\\r?\\n)+`);if(w){let P=w.match(S);if(P){let O=P[0].length;T=w.slice(0,O)+R+w.slice(O)}else T=`${Z}

${R}${w}`}else T=`${Z}

${R}`;if(this.context.stdout.write(`Applying ${f.length} entry(ies) to ${m}
`),this.dryRun){if(this.verbose){this.context.stdout.write(`  Would write to: ${D}
`);for(let P of f)this.context.stdout.write(`  Would delete: ${P.filename}
`)}}else{await u.xfs.writeFilePromise(D,T);for(let P of f)await u.xfs.unlinkPromise(P.path),this.verbose&&this.context.stdout.write(`  Deleted: ${P.filename}
`)}d+=f.length}let h=this.dryRun?"Would apply":"Applied";return this.context.stdout.write(`
${h} ${d} changelog entry(ies) to ${o.size} package(s).
`),a.length>0?1:0}};var me=y("@yarnpkg/cli"),K=y("@yarnpkg/core"),x=y("@yarnpkg/fslib"),W=y("clipanion");function ve(e){return e==="patch"||e==="minor"||e==="major"}function B(e,t){let n=[],r=e.split(`
`),p=!1;for(let i of r){let l=i.trim();if(l==="releases:"){p=!0;continue}if(p&&l){let a=l.match(/^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/);if(a){let o=a[1],c=a[2];ve(c)&&n.push({packageName:o,versionType:c})}}}return{id:be(t),path:t,releases:n}}function de(e){return e.replace(/\//g,"-")}function be(e){return(e.split("/").pop()??"").replace(".yml","")}var Ae="Updated dependencies",Ie=`<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->`,Oe={[s.BREAKING_CHANGES]:"Describe breaking changes (BREAKING CHANGE:)",[s.DEPRECATED]:"Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag.",[s.FEATURES]:"Describe your shiny new features (feat:)",[s.BUG_FIXES]:"Describe the nasty little bugs that has been eradicated (fix:)",[s.DOCUMENTATION]:"Describe documentation changes (docs:)",[s.PERFORMANCE]:"Describe performance improvements (perf:)",[s.REFACTORING]:"Describe code refactoring (refactor:)",[s.TESTS]:"Describe test changes (test:)",[s.BUILD]:"Describe build system changes (build:)",[s.CI]:"Describe CI configuration changes (ci:)",[s.DEPENDENCIES]:"Describe dependency updates (deps:)",[s.CHORES]:"Describe other changes (chore:)"},$e="<!-- MIGRATION REQUIRED: Explain how to migrate from the previous version -->",Ge=[s.BREAKING_CHANGES,s.DEPRECATED,s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES],Fe=[s.DEPRECATED,s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES],je=[s.FEATURES,s.BUG_FIXES,s.DOCUMENTATION,s.PERFORMANCE,s.REFACTORING,s.TESTS,s.BUILD,s.CI,s.DEPENDENCIES,s.CHORES];function _e(e,t=!1){let n=Oe[e],r=`## ${e}
<!-- PLACEHOLDER: ${n} -->`;return t&&(r+=`
${$e}`),r}function Me(e){return(e==="major"?Ge:e==="minor"?Fe:je).map(n=>{let r=n===s.BREAKING_CHANGES;return _e(n,r)}).join(`

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
    `,examples:[["Validate changelogs","yarn changelog check"]]});verbose=W.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});async execute(){let t=await K.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await K.Project.find(t,this.context.cwd),r=x.ppath.join(n.cwd,M),p=x.ppath.join(n.cwd,b);if(!await x.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to check.
`),0;let l=(await x.xfs.readdirPromise(r)).filter(c=>c.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to check.
`),0;let a=[],o=0;for(let c of l){let d=x.ppath.join(r,c),h=await x.xfs.readFilePromise(d,"utf8"),m=B(h,d);this.verbose&&this.context.stdout.write(`Checking manifest: ${c}
`);for(let f of m.releases){let E=H(f.packageName,m.id),g=x.ppath.join(p,E);if(!await x.xfs.existsPromise(g)){a.push(`Missing changelog for ${f.packageName} (manifest: ${m.id}). Run 'yarn changelog create' to generate it.`);continue}let N=await x.xfs.readFilePromise(g,"utf8"),D=k(N),w=_(D,{expectedVersionType:f.versionType});if(w.length>0)for(let A of w)a.push(`${f.packageName} (${E}): ${A}`);else this.verbose&&this.context.stdout.write(`  \u2713 ${f.packageName}
`);o++}}if(a.length>0){this.context.stderr.write(`
Changelog validation failed:

`);for(let c of a)this.context.stderr.write(`  \u2717 ${c}
`);return this.context.stderr.write(`
Found ${a.length} error(s).
`),1}return this.context.stdout.write(`
\u2713 All ${o} changelog(s) are valid.
`),0}};var fe=y("@yarnpkg/cli"),Y=y("@yarnpkg/core"),C=y("@yarnpkg/fslib"),v=y("clipanion");var z=class extends fe.BaseCommand{static paths=[["changelog","create"]];static usage=v.Command.Usage({description:"Generate changelog drafts from version manifests",details:`
      This command reads all version manifests in \`.yarn/versions/*.yml\`
      and generates draft changelog files in \`.yarn/changelogs/\`.

      Each draft includes sections for Added, Changed, and Fixed entries.
      For major/minor releases, additional sections are included.

      Existing changelog drafts are not overwritten unless --force is used.

      Use --dependabot to auto-fill changelogs for dependency updates.
      The --message option can provide a custom message (e.g., PR title).
    `,examples:[["Generate changelog drafts","yarn changelog create"],["Regenerate mismatched/invalid changelogs","yarn changelog create --force"],["Generate for Dependabot PR","yarn changelog create --dependabot"],["Generate with custom message",'yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"']]});verbose=v.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});force=v.Option.Boolean("-f,--force",!1,{description:"Regenerate changelogs with mismatched version types or invalid entries"});dependabot=v.Option.Boolean("--dependabot",!1,{description:"Auto-fill changelog for dependency updates (Dependabot PRs)"});message=v.Option.String("-m,--message",{description:"Custom message for the changelog entry (used with --dependabot)"});async execute(){let t=await Y.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await Y.Project.find(t,this.context.cwd),r=C.ppath.join(n.cwd,M),p=C.ppath.join(n.cwd,b);if(await C.xfs.mkdirPromise(p,{recursive:!0}),!await C.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to do.
`),0;let l=(await C.xfs.readdirPromise(r)).filter(h=>h.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to do.
`),0;let a=0,o=0,c=0;for(let h of l){let m=C.ppath.join(r,h),f=await C.xfs.readFilePromise(m,"utf8"),E=B(f,m);this.verbose&&this.context.stdout.write(`Processing manifest: ${h}
`);for(let g of E.releases){let N=H(g.packageName,E.id),D=C.ppath.join(p,N);if(await C.xfs.existsPromise(D)){let A=await C.xfs.readFilePromise(D,"utf8"),I=k(A),R=ge(I,g.versionType);if(this.force&&R.shouldRegenerate){let T=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await C.xfs.writeFilePromise(D,T);let S=[];R.hasVersionMismatch&&S.push(`${I.versionType} \u2192 ${g.versionType}`),R.contentErrors.length>0&&S.push(...R.contentErrors),this.context.stdout.write(`  Regenerated: ${N} (${S.join(", ")})
`),o++;continue}if(this.verbose)if(R.shouldRegenerate){let T=[];R.hasVersionMismatch&&T.push(`version mismatch: ${I.versionType} vs ${g.versionType}`),R.contentErrors.length>0&&T.push(...R.contentErrors.map(S=>S.toLowerCase())),this.context.stdout.write(`  Skipping ${g.packageName} (${T.join("; ")}, use --force to regenerate)
`)}else this.context.stdout.write(`  Skipping ${g.packageName} (already exists)
`);c++;continue}let w=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await C.xfs.writeFilePromise(D,w),this.context.stdout.write(`  Created: ${N} (${g.versionType})
`),a++}}let d=[`Created ${a}`];return o>0&&d.push(`regenerated ${o}`),d.push(`skipped ${c}`),this.context.stdout.write(`
Done! ${d.join(", ")} changelog draft(s).
`),0}};var Ve={commands:[z,U,V]},Le=Ve;return Pe(Be);})();
return plugin;
}
};
