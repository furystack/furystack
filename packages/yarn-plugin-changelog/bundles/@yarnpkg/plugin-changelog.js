/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-changelog",
factory: function (require) {
"use strict";var plugin=(()=>{var fe=Object.create;var G=Object.defineProperty;var ue=Object.getOwnPropertyDescriptor;var Ee=Object.getOwnPropertyNames;var ye=Object.getPrototypeOf,Ce=Object.prototype.hasOwnProperty;var E=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var Pe=(e,t)=>{for(var n in t)G(e,n,{get:t[n],enumerable:!0})},te=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let c of Ee(t))!Ce.call(e,c)&&c!==n&&G(e,c,{get:()=>t[c],enumerable:!(r=ue(t,c))||r.enumerable});return e};var W=(e,t,n)=>(n=e!=null?fe(ye(e)):{},te(t||!e||!e.__esModule?G(n,"default",{value:e,enumerable:!0}):n,e)),Ne=e=>te(G({},"__esModule",{value:!0}),e);var Be={};Pe(Be,{default:()=>Le});var le=E("@yarnpkg/cli"),M=E("@yarnpkg/core"),f=E("@yarnpkg/fslib"),$=E("clipanion");var ne=W(E("fs"));function oe(e,t){try{let n=ne.default.readFileSync(e,"utf8"),r=JSON.parse(n),c=JSON.parse(t),i={...r.dependencies,...r.devDependencies},l={...c.dependencies,...c.devDependencies},a={},s={};for(let[p,h]of Object.entries(i))l[p]?l[p]!==h&&(s[p]=h):a[p]=h;return{added:a,updated:s}}catch(n){return console.error("Error diffing package.json files:",n),{added:{},updated:{}}}}var se=W(E("fs")),Y=W(E("path")),re=E("child_process");function J(e,t,n){let r=`## [${t}] - ${n}

`,c=e.sections.map(i=>i.isEmpty?"":`### ${i.name}
${i.content.trim()}

`).join("");if(r+=c,e.includeDependencies&&e.upstreamBranch)try{let i=Y.default.join(process.cwd(),"packages",e.packageName),l=Y.default.join(i,"package.json");if(se.default.existsSync(l)){let a=e.upstreamBranch,s=(0,re.execSync)(`git show ${a}:${l}`,{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).toString(),{added:p,updated:h}=oe(l,s);if(Object.keys(p).length>0||Object.keys(h).length>0){let d=Object.entries({...p,...h}).sort((m,u)=>m[0].localeCompare(u[0])).map(([m,u])=>`- ${m}@${u}`).join(`
`);r+=`## \u{1F4E6} Dependencies
${d}

`}}}catch(i){console.error("Error generating dependencies section:",i)}return r}var ie={heading:1,other:2,list:3};function Re(e){let t=e.trim();if(!t)return"other";let n=t.split(`
`)[0].trim();return/^#{2,}/.test(n)?"heading":/^[-*+]/.test(n)||/^\d+\./.test(n)?"list":"other"}function De(e){let t=e.trim();return/^[-*+]/.test(t)||/^\d+\./.test(t)}function ae(e){if(e.length===0)return"";let t=e.map(i=>({content:i.trim(),type:Re(i)}));t.sort((i,l)=>ie[i.type]-ie[l.type]);let n=t.filter(i=>i.type!=="list"),r=t.filter(i=>i.type==="list"),c=[];for(let i of n)c.push(i.content);if(r.length>0){let i=[];for(let l of r){let a=l.content.split(`
`);for(let s of a)s.trim()&&(De(s)||/^\s+/.test(s))&&i.push(s)}i.length>0&&c.push(i.join(`
`))}return c.join(`

`)}var ce={major:3,minor:2,patch:1};function X(e){if(e.length===0)return{packageName:"",versionType:"patch",sections:[],hasPlaceholders:!1};if(e.length===1)return e[0];let{packageName:t}=e[0],n=e.some(a=>a.hasPlaceholders),r=e.reduce((a,s)=>{let p=ce[s.versionType]??0,h=ce[a]??0;return p>h?s.versionType:a},"patch"),c=new Map,i=[];for(let a of e)for(let s of a.sections){c.has(s.name)||(c.set(s.name,[]),i.push(s.name));let p=s.content.trim();if(!p)continue;let h=c.get(s.name);h.some(d=>d.trim().toLowerCase()===p.toLowerCase())||h.push(p)}let l=i.map(a=>{let s=c.get(a)??[],p=ae(s);return{name:a,content:p?`${p}
`:"",isEmpty:!p}});return{packageName:t,versionType:r,sections:l,hasPlaceholders:n}}var o={BREAKING_CHANGES:"\u{1F4A5} Breaking Changes",DEPRECATED:"\u{1F5D1}\uFE0F Deprecated",FEATURES:"\u2728 Features",BUG_FIXES:"\u{1F41B} Bug Fixes",DOCUMENTATION:"\u{1F4DA} Documentation",PERFORMANCE:"\u26A1 Performance",REFACTORING:"\u267B\uFE0F Refactoring",TESTS:"\u{1F9EA} Tests",BUILD:"\u{1F4E6} Build",CI:"\u{1F477} CI",DEPENDENCIES:"\u2B06\uFE0F Dependencies",CHORES:"\u{1F527} Chores"};function F(e,t={}){let n=[];return t.expectedVersionType&&e.versionType!==t.expectedVersionType&&n.push(`Version type mismatch: changelog has "${e.versionType}" but manifest expects "${t.expectedVersionType}". Run 'yarn changelog create --force' to regenerate.`),e.versionType==="major"&&!e.sections.some(c=>c.name===o.BREAKING_CHANGES&&!c.isEmpty)&&n.push(`Major release requires filled "${o.BREAKING_CHANGES}" section`),e.sections.filter(c=>!c.isEmpty).length===0&&n.push("At least one section must have content"),n}function pe(e,t){let n=[];return e||n.push(`${t}: Missing package name heading. Expected a heading like "# @furystack/package-name" at the start of the file.`),{isValid:n.length===0,errors:n}}function ge(e,t){let n=e.versionType!==t,c=F(e,{expectedVersionType:t}).filter(i=>!i.includes("Version type mismatch"));return{shouldRegenerate:n||c.length>0,hasVersionMismatch:n,contentErrors:c}}var xe="patch",Te="<!-- PLACEHOLDER:",we=/<!-- version-type: (\w+) -->/,Se=/^# (.+)$/m,ke=/^## (.+)$/;function k(e){let t=e.split(`
`),r=e.match(we)?.[1]??xe,i=e.match(Se)?.[1]??"",l=e.includes(Te),a=[],s=null;for(let p of t){let h=p.match(ke);h?(s&&a.push(s),s={name:h[1],content:"",isEmpty:!0}):s&&!p.trim().startsWith("<!--")&&(s.content+=`${p}
`,p.trim()&&(s.isEmpty=!1))}return s&&a.push(s),{packageName:i,versionType:r,sections:a,hasPlaceholders:l}}var b=".yarn/changelogs",_=".yarn/versions";var q="0.0.0",Q="# Changelog",j=class extends le.BaseCommand{static paths=[["changelog","apply"]];static usage=$.Command.Usage({description:"Apply changelog entries to package CHANGELOG.md files",details:`
      This command:
      - Reads all changelog drafts from \`.yarn/changelogs/\`
      - Groups entries by package name
      - Prepends new entries to each package's CHANGELOG.md
      - Deletes processed draft files
    `,examples:[["Apply changelogs","yarn changelog apply"]]});verbose=$.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});dryRun=$.Option.Boolean("--dry-run",!1,{description:"Show what would be done without making changes"});async execute(){let t=await M.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await M.Project.find(t,this.context.cwd),r=f.ppath.join(n.cwd,b);if(this.dryRun&&this.context.stdout.write(`[DRY RUN] No changes will be made.

`),!await f.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/changelogs directory found. Nothing to apply.
`),0;let i=(await f.xfs.readdirPromise(r)).filter(d=>d.endsWith(".md"));if(i.length===0)return this.context.stdout.write(`No changelog drafts found. Nothing to apply.
`),0;let l=[],a=[];for(let d of i){let m=f.ppath.join(r,d),u=await f.xfs.readFilePromise(m,"utf8"),g=k(u),C=pe(g.packageName,d);if(!C.isValid){a.push(...C.errors);continue}l.push({path:m,filename:d,packageName:g.packageName,content:u})}if(a.length>0){this.context.stderr.write(`Validation errors found:
`);for(let d of a)this.context.stderr.write(`  \u2717 ${d}
`);this.context.stderr.write(`
Invalid drafts were skipped and not deleted.

`)}let s=new Map;for(let d of l){let m=s.get(d.packageName)??[];m.push(d),s.set(d.packageName,m)}let p=new Date().toISOString().split("T")[0],h=0;for(let[d,m]of s){let u=n.workspaces.find(P=>P.manifest.raw.name===d),g,C;if(u)g=u.cwd,C=u.manifest.version??q;else{let P=d.replace(/^@[^/]+\//,"");g=f.ppath.join(n.cwd,`packages/${P}`);let O=f.ppath.join(g,"package.json");await f.xfs.existsPromise(O)?C=JSON.parse(await f.xfs.readFilePromise(O,"utf8")).version??q:C=q}if(!await f.xfs.existsPromise(g))throw new Error(`Package directory not found: ${g}
Package '${d}' has changelog entries but no workspace directory exists.
This may indicate the package was deleted or uses a non-standard directory structure.`);let R=f.ppath.join(g,"CHANGELOG.md"),D="";await f.xfs.existsPromise(R)&&(D=await f.xfs.readFilePromise(R,"utf8"));let A=m.map(P=>k(P.content)),I=X(A),N=J(I,C,p),w,S=new RegExp(`^${Q}(?:\\r?\\n)+`);if(D){let P=D.match(S);if(P){let O=P[0].length;w=D.slice(0,O)+N+D.slice(O)}else w=`${Q}

${N}${D}`}else w=`${Q}

${N}`;if(this.context.stdout.write(`Applying ${m.length} entry(ies) to ${d}
`),this.dryRun){if(this.verbose){this.context.stdout.write(`  Would write to: ${R}
`);for(let P of m)this.context.stdout.write(`  Would delete: ${P.filename}
`)}}else{await f.xfs.writeFilePromise(R,w);for(let P of m)await f.xfs.unlinkPromise(P.path),this.verbose&&this.context.stdout.write(`  Deleted: ${P.filename}
`)}h+=m.length}let T=this.dryRun?"Would apply":"Applied";return this.context.stdout.write(`
${T} ${h} changelog entry(ies) to ${s.size} package(s).
`),a.length>0?1:0}};var he=E("@yarnpkg/cli"),H=E("@yarnpkg/core"),x=E("@yarnpkg/fslib"),U=E("clipanion");function ve(e){return e==="patch"||e==="minor"||e==="major"}function V(e,t){let n=[],r=e.split(`
`),c=!1;for(let i of r){let l=i.trim();if(l==="releases:"){c=!0;continue}if(c&&l){let a=l.match(/^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/);if(a){let s=a[1],p=a[2];ve(p)&&n.push({packageName:s,versionType:p})}}}return{id:be(t),path:t,releases:n}}function de(e){return e.replace(/\//g,"-")}function be(e){return(e.split("/").pop()??"").replace(".yml","")}var Ae="Updated dependencies",Ie=`<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->`,Oe={[o.BREAKING_CHANGES]:"Describe breaking changes (BREAKING CHANGE:)",[o.DEPRECATED]:"Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag.",[o.FEATURES]:"Describe your shiny new features (feat:)",[o.BUG_FIXES]:"Describe the nasty little bugs that has been eradicated (fix:)",[o.DOCUMENTATION]:"Describe documentation changes (docs:)",[o.PERFORMANCE]:"Describe performance improvements (perf:)",[o.REFACTORING]:"Describe code refactoring (refactor:)",[o.TESTS]:"Describe test changes (test:)",[o.BUILD]:"Describe build system changes (build:)",[o.CI]:"Describe CI configuration changes (ci:)",[o.DEPENDENCIES]:"Describe dependency updates (deps:)",[o.CHORES]:"Describe other changes (chore:)"},$e="<!-- MIGRATION REQUIRED: Explain how to migrate from the previous version -->",Ge=[o.BREAKING_CHANGES,o.DEPRECATED,o.FEATURES,o.BUG_FIXES,o.DOCUMENTATION,o.PERFORMANCE,o.REFACTORING,o.TESTS,o.BUILD,o.CI,o.DEPENDENCIES,o.CHORES],Fe=[o.DEPRECATED,o.FEATURES,o.BUG_FIXES,o.DOCUMENTATION,o.PERFORMANCE,o.REFACTORING,o.TESTS,o.BUILD,o.CI,o.DEPENDENCIES,o.CHORES],_e=[o.FEATURES,o.BUG_FIXES,o.DOCUMENTATION,o.PERFORMANCE,o.REFACTORING,o.TESTS,o.BUILD,o.CI,o.DEPENDENCIES,o.CHORES];function je(e,t=!1){let n=Oe[e],r=`## ${e}
<!-- PLACEHOLDER: ${n} -->`;return t&&(r+=`
${$e}`),r}function Me(e){return(e==="major"?Ge:e==="minor"?Fe:_e).map(n=>{let r=n===o.BREAKING_CHANGES;return je(n,r)}).join(`

`)}function Z(e,t){let n=Me(t);return`<!-- version-type: ${t} -->
# ${e}

${Ie}

${n}
`}function L(e,t){return`${de(e)}.${t}.md`}function ee(e,t,n){let r=n||Ae;return t==="major"?`<!-- version-type: ${t} -->
# ${e}

## ${o.BREAKING_CHANGES}
- ${r}

## ${o.DEPENDENCIES}
- ${r}
`:`<!-- version-type: ${t} -->
# ${e}

## ${o.DEPENDENCIES}
- ${r}
`}var B=class extends he.BaseCommand{static paths=[["changelog","check"]];static usage=U.Command.Usage({description:"Validate changelog entries for all version manifests",details:`
      This command validates that:
      - Every release in \`.yarn/versions/*.yml\` has a changelog file
      - Major releases have filled BREAKING CHANGES sections
      - At least one section (Added/Changed/Fixed) has content
    `,examples:[["Validate changelogs","yarn changelog check"]]});verbose=U.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});async execute(){let t=await H.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await H.Project.find(t,this.context.cwd),r=x.ppath.join(n.cwd,_),c=x.ppath.join(n.cwd,b);if(!await x.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to check.
`),0;let l=(await x.xfs.readdirPromise(r)).filter(p=>p.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to check.
`),0;let a=[],s=0;for(let p of l){let h=x.ppath.join(r,p),T=await x.xfs.readFilePromise(h,"utf8"),d=V(T,h);this.verbose&&this.context.stdout.write(`Checking manifest: ${p}
`);for(let m of d.releases){let u=L(m.packageName,d.id),g=x.ppath.join(c,u);if(!await x.xfs.existsPromise(g)){a.push(`Missing changelog for ${m.packageName} (manifest: ${d.id}). Run 'yarn changelog create' to generate it.`);continue}let C=await x.xfs.readFilePromise(g,"utf8"),R=k(C),D=F(R,{expectedVersionType:m.versionType});if(D.length>0)for(let A of D)a.push(`${m.packageName} (${u}): ${A}`);else this.verbose&&this.context.stdout.write(`  \u2713 ${m.packageName}
`);s++}}if(a.length>0){this.context.stderr.write(`
Changelog validation failed:

`);for(let p of a)this.context.stderr.write(`  \u2717 ${p}
`);return this.context.stderr.write(`
Found ${a.length} error(s).
`),1}return this.context.stdout.write(`
\u2713 All ${s} changelog(s) are valid.
`),0}};var me=E("@yarnpkg/cli"),z=E("@yarnpkg/core"),y=E("@yarnpkg/fslib"),v=E("clipanion");var K=class extends me.BaseCommand{static paths=[["changelog","create"]];static usage=v.Command.Usage({description:"Generate changelog drafts from version manifests",details:`
      This command reads all version manifests in \`.yarn/versions/*.yml\`
      and generates draft changelog files in \`.yarn/changelogs/\`.

      Each draft includes sections for Added, Changed, and Fixed entries.
      For major/minor releases, additional sections are included.

      Existing changelog drafts are not overwritten unless --force is used.

      Use --dependabot to auto-fill changelogs for dependency updates.
      The --message option can provide a custom message (e.g., PR title).
    `,examples:[["Generate changelog drafts","yarn changelog create"],["Regenerate mismatched/invalid changelogs","yarn changelog create --force"],["Generate for Dependabot PR","yarn changelog create --dependabot"],["Generate with custom message",'yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"']]});verbose=v.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});force=v.Option.Boolean("-f,--force",!1,{description:"Regenerate changelogs with mismatched version types or invalid entries"});dependabot=v.Option.Boolean("--dependabot",!1,{description:"Auto-fill changelog for dependency updates (Dependabot PRs)"});message=v.Option.String("-m,--message",{description:"Custom message for the changelog entry (used with --dependabot)"});async execute(){let t=await z.Configuration.find(this.context.cwd,this.context.plugins),{project:n}=await z.Project.find(t,this.context.cwd),r=y.ppath.join(n.cwd,_),c=y.ppath.join(n.cwd,b);if(await y.xfs.mkdirPromise(c,{recursive:!0}),!await y.xfs.existsPromise(r))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to do.
`),0;let l=(await y.xfs.readdirPromise(r)).filter(T=>T.endsWith(".yml"));if(l.length===0)return this.context.stdout.write(`No version manifests found. Nothing to do.
`),0;let a=0,s=0,p=0;for(let T of l){let d=y.ppath.join(r,T),m=await y.xfs.readFilePromise(d,"utf8"),u=V(m,d);this.verbose&&this.context.stdout.write(`Processing manifest: ${T}
`);for(let g of u.releases){let C=L(g.packageName,u.id),R=y.ppath.join(c,C);if(await y.xfs.existsPromise(R)){let A=await y.xfs.readFilePromise(R,"utf8"),I=k(A),N=ge(I,g.versionType);if(this.force&&N.shouldRegenerate){let w=this.dependabot?ee(g.packageName,g.versionType,this.message):Z(g.packageName,g.versionType);await y.xfs.writeFilePromise(R,w);let S=[];N.hasVersionMismatch&&S.push(`${I.versionType} \u2192 ${g.versionType}`),N.contentErrors.length>0&&S.push(...N.contentErrors),this.context.stdout.write(`  Regenerated: ${C} (${S.join(", ")})
`),s++;continue}if(this.verbose)if(N.shouldRegenerate){let w=[];N.hasVersionMismatch&&w.push(`version mismatch: ${I.versionType} vs ${g.versionType}`),N.contentErrors.length>0&&w.push(...N.contentErrors.map(S=>S.toLowerCase())),this.context.stdout.write(`  Skipping ${g.packageName} (${w.join("; ")}, use --force to regenerate)
`)}else this.context.stdout.write(`  Skipping ${g.packageName} (already exists)
`);p++;continue}let D=this.dependabot?ee(g.packageName,g.versionType,this.message):Z(g.packageName,g.versionType);await y.xfs.writeFilePromise(R,D),this.context.stdout.write(`  Created: ${C} (${g.versionType})
`),a++}}let h=[`Created ${a}`];return s>0&&h.push(`regenerated ${s}`),h.push(`skipped ${p}`),this.context.stdout.write(`
Done! ${h.join(", ")} changelog draft(s).
`),0}};var Ve={commands:[K,B,j]},Le=Ve;return Ne(Be);})();
return plugin;
}
};
