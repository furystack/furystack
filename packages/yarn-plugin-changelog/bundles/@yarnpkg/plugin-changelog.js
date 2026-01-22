/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-changelog",
factory: function (require) {
"use strict";var plugin=(()=>{var z=Object.defineProperty;var le=Object.getOwnPropertyDescriptor;var ge=Object.getOwnPropertyNames;var pe=Object.prototype.hasOwnProperty;var N=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,o)=>(typeof require<"u"?require:t)[o]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var he=(e,t)=>{for(var o in t)z(e,o,{get:t[o],enumerable:!0})},de=(e,t,o,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of ge(t))!pe.call(e,i)&&i!==o&&z(e,i,{get:()=>t[i],enumerable:!(s=le(t,i))||s.enumerable});return e};var me=e=>de(z({},"__esModule",{value:!0}),e);var $e={};he($e,{default:()=>Oe});var re=N("@yarnpkg/cli"),M=N("@yarnpkg/core"),f=N("@yarnpkg/fslib"),$=N("clipanion");function W(e,t,o){let s=`## [${t}] - ${o}

`;for(let i of e.sections)i.isEmpty||(s+=`### ${i.name}
`,s+=`${i.content.trim()}

`);return s}var ne={heading:1,other:2,list:3};function oe(e){let t=e.trim();if(!t)return"other";let o=t.split(`
`)[0].trim();return/^#{2,}/.test(o)?"heading":/^[-*+]/.test(o)||/^\d+\./.test(o)?"list":"other"}function fe(e){let t=e.trim();return/^[-*+]/.test(t)||/^\d+\./.test(t)}function Y(e){if(e.length===0)return"";let t=e.map(l=>({content:l.trim(),type:oe(l)}));t.sort((l,h)=>ne[l.type]-ne[h.type]);let o=t.filter(l=>l.type!=="list"),s=t.filter(l=>l.type==="list"),i=[];for(let l of o)i.push(l.content);if(s.length>0){let l=[];for(let h of s){let a=h.content.split(`
`);for(let r of a)r.trim()&&(fe(r)||/^\s+/.test(r))&&l.push(r)}l.length>0&&i.push(l.join(`
`))}return i.join(`

`)}var se={major:3,minor:2,patch:1};function X(e){if(e.length===0)return{packageName:"",versionType:"patch",sections:[],hasPlaceholders:!1};if(e.length===1)return e[0];let{packageName:t}=e[0],o=e.some(a=>a.hasPlaceholders),s=e.reduce((a,r)=>{let c=se[r.versionType]??0,m=se[a]??0;return c>m?r.versionType:a},"patch"),i=new Map,l=[];for(let a of e)for(let r of a.sections){i.has(r.name)||(i.set(r.name,[]),l.push(r.name));let c=r.content.trim();if(!c)continue;let m=i.get(r.name);m.some(p=>p.trim().toLowerCase()===c.toLowerCase())||m.push(c)}let h=l.map(a=>{let r=i.get(a)??[],c=Y(r);return{name:a,content:c?`${c}
`:"",isEmpty:!c}});return{packageName:t,versionType:s,sections:h,hasPlaceholders:o}}var n={BREAKING_CHANGES:"\u{1F4A5} Breaking Changes",DEPRECATED:"\u{1F5D1}\uFE0F Deprecated",FEATURES:"\u2728 Features",BUG_FIXES:"\u{1F41B} Bug Fixes",DOCUMENTATION:"\u{1F4DA} Documentation",PERFORMANCE:"\u26A1 Performance",REFACTORING:"\u267B\uFE0F Refactoring",TESTS:"\u{1F9EA} Tests",BUILD:"\u{1F4E6} Build",CI:"\u{1F477} CI",DEPENDENCIES:"\u2B06\uFE0F Dependencies",CHORES:"\u{1F527} Chores"};function G(e,t={}){let o=[];return t.expectedVersionType&&e.versionType!==t.expectedVersionType&&o.push(`Version type mismatch: changelog has "${e.versionType}" but manifest expects "${t.expectedVersionType}". Run 'yarn changelog create --force' to regenerate.`),e.versionType==="major"&&!e.sections.some(i=>i.name===n.BREAKING_CHANGES&&!i.isEmpty)&&o.push(`Major release requires filled "${n.BREAKING_CHANGES}" section`),e.sections.filter(i=>!i.isEmpty).length===0&&o.push("At least one section must have content"),o}function J(e,t){let o=[];return e||o.push(`${t}: Missing package name heading. Expected a heading like "# @furystack/package-name" at the start of the file.`),{isValid:o.length===0,errors:o}}function q(e,t){let o=e.versionType!==t,i=G(e,{expectedVersionType:t}).filter(l=>!l.includes("Version type mismatch"));return{shouldRegenerate:o||i.length>0,hasVersionMismatch:o,contentErrors:i}}var ue="patch",Ee="<!-- PLACEHOLDER:",ye=/<!-- version-type: (\w+) -->/,Ce=/^# (.+)$/m,Pe=/^## (.+)$/;function A(e){let t=e.split(`
`),s=e.match(ye)?.[1]??ue,l=e.match(Ce)?.[1]??"",h=e.includes(Ee),a=[],r=null;for(let c of t){let m=c.match(Pe);m?(r&&a.push(r),r={name:m[1],content:"",isEmpty:!0}):r&&!c.trim().startsWith("<!--")&&(r.content+=`${c}
`,c.trim()&&(r.isEmpty=!1))}return r&&a.push(r),{packageName:l,versionType:s,sections:a,hasPlaceholders:h}}var I=".yarn/changelogs",F=".yarn/versions";var Q="0.0.0",Z="# Changelog",_=class extends re.BaseCommand{static paths=[["changelog","apply"]];static usage=$.Command.Usage({description:"Apply changelog entries to package CHANGELOG.md files",details:`
      This command:
      - Reads all changelog drafts from \`.yarn/changelogs/\`
      - Groups entries by package name
      - Prepends new entries to each package's CHANGELOG.md
      - Deletes processed draft files
    `,examples:[["Apply changelogs","yarn changelog apply"]]});verbose=$.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});dryRun=$.Option.Boolean("--dry-run",!1,{description:"Show what would be done without making changes"});async execute(){let t=await M.Configuration.find(this.context.cwd,this.context.plugins),{project:o}=await M.Project.find(t,this.context.cwd),s=f.ppath.join(o.cwd,I);if(this.dryRun&&this.context.stdout.write(`[DRY RUN] No changes will be made.

`),!await f.xfs.existsPromise(s))return this.context.stdout.write(`No .yarn/changelogs directory found. Nothing to apply.
`),0;let l=(await f.xfs.readdirPromise(s)).filter(p=>p.endsWith(".md"));if(l.length===0)return this.context.stdout.write(`No changelog drafts found. Nothing to apply.
`),0;let h=[],a=[];for(let p of l){let d=f.ppath.join(s,p),C=await f.xfs.readFilePromise(d,"utf8"),g=A(C),E=J(g.packageName,p);if(!E.isValid){a.push(...E.errors);continue}h.push({path:d,filename:p,packageName:g.packageName,content:C})}if(a.length>0){this.context.stderr.write(`Validation errors found:
`);for(let p of a)this.context.stderr.write(`  \u2717 ${p}
`);this.context.stderr.write(`
Invalid drafts were skipped and not deleted.

`)}let r=new Map;for(let p of h){let d=r.get(p.packageName)??[];d.push(p),r.set(p.packageName,d)}let c=new Date().toISOString().split("T")[0],m=0;for(let[p,d]of r){let C=o.workspaces.find(y=>y.manifest.raw.name===p),g,E;if(C)g=C.cwd,E=C.manifest.version??Q;else{let y=p.replace(/^@[^/]+\//,"");g=f.ppath.join(o.cwd,`packages/${y}`);let O=f.ppath.join(g,"package.json");await f.xfs.existsPromise(O)?E=JSON.parse(await f.xfs.readFilePromise(O,"utf8")).version??Q:E=Q}if(!await f.xfs.existsPromise(g))throw new Error(`Package directory not found: ${g}
Package '${p}' has changelog entries but no workspace directory exists.
This may indicate the package was deleted or uses a non-standard directory structure.`);let R=f.ppath.join(g,"CHANGELOG.md"),T="";await f.xfs.existsPromise(R)&&(T=await f.xfs.readFilePromise(R,"utf8"));let b=d.map(y=>A(y.content)),k=X(b),P=W(k,E,c),x,S=new RegExp(`^${Z}(?:\\r?\\n)+`);if(T){let y=T.match(S);if(y){let O=y[0].length;x=T.slice(0,O)+P+T.slice(O)}else x=`${Z}

${P}${T}`}else x=`${Z}

${P}`;if(this.context.stdout.write(`Applying ${d.length} entry(ies) to ${p}
`),this.dryRun){if(this.verbose){this.context.stdout.write(`  Would write to: ${R}
`);for(let y of d)this.context.stdout.write(`  Would delete: ${y.filename}
`)}}else{await f.xfs.writeFilePromise(R,x);for(let y of d)await f.xfs.unlinkPromise(y.path),this.verbose&&this.context.stdout.write(`  Deleted: ${y.filename}
`)}m+=d.length}let D=this.dryRun?"Would apply":"Applied";return this.context.stdout.write(`
${D} ${m} changelog entry(ies) to ${r.size} package(s).
`),a.length>0?1:0}};var ae=N("@yarnpkg/cli"),H=N("@yarnpkg/core"),w=N("@yarnpkg/fslib"),U=N("clipanion");function Ne(e){return e==="patch"||e==="minor"||e==="major"}function V(e,t){let o=[],s=e.split(`
`),i=!1;for(let l of s){let h=l.trim();if(h==="releases:"){i=!0;continue}if(i&&h){let a=h.match(/^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/);if(a){let r=a[1],c=a[2];Ne(c)&&o.push({packageName:r,versionType:c})}}}return{id:Re(t),path:t,releases:o}}function ie(e){return e.replace(/\//g,"-")}function Re(e){return(e.split("/").pop()??"").replace(".yml","")}var Te="Updated dependencies",we=`<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->`,xe={[n.BREAKING_CHANGES]:"Describe breaking changes (BREAKING CHANGE:)",[n.DEPRECATED]:"Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag.",[n.FEATURES]:"Describe your shiny new features (feat:)",[n.BUG_FIXES]:"Describe the nasty little bugs that has been eradicated (fix:)",[n.DOCUMENTATION]:"Describe documentation changes (docs:)",[n.PERFORMANCE]:"Describe performance improvements (perf:)",[n.REFACTORING]:"Describe code refactoring (refactor:)",[n.TESTS]:"Describe test changes (test:)",[n.BUILD]:"Describe build system changes (build:)",[n.CI]:"Describe CI configuration changes (ci:)",[n.DEPENDENCIES]:"Describe dependency updates (deps:)",[n.CHORES]:"Describe other changes (chore:)"},De="<!-- MIGRATION REQUIRED: Explain how to migrate from the previous version -->",Se=[n.BREAKING_CHANGES,n.DEPRECATED,n.FEATURES,n.BUG_FIXES,n.DOCUMENTATION,n.PERFORMANCE,n.REFACTORING,n.TESTS,n.BUILD,n.CI,n.DEPENDENCIES,n.CHORES],Ae=[n.DEPRECATED,n.FEATURES,n.BUG_FIXES,n.DOCUMENTATION,n.PERFORMANCE,n.REFACTORING,n.TESTS,n.BUILD,n.CI,n.DEPENDENCIES,n.CHORES],ve=[n.FEATURES,n.BUG_FIXES,n.DOCUMENTATION,n.PERFORMANCE,n.REFACTORING,n.TESTS,n.BUILD,n.CI,n.DEPENDENCIES,n.CHORES];function Ie(e,t=!1){let o=xe[e],s=`## ${e}
<!-- PLACEHOLDER: ${o} -->`;return t&&(s+=`
${De}`),s}function be(e){return(e==="major"?Se:e==="minor"?Ae:ve).map(o=>{let s=o===n.BREAKING_CHANGES;return Ie(o,s)}).join(`

`)}function ee(e,t){let o=be(t);return`<!-- version-type: ${t} -->
# ${e}

${we}

${o}
`}function L(e,t){return`${ie(e)}.${t}.md`}function te(e,t,o){let s=o||Te;return t==="major"?`<!-- version-type: ${t} -->
# ${e}

## ${n.BREAKING_CHANGES}
- ${s}

## ${n.DEPENDENCIES}
- ${s}
`:`<!-- version-type: ${t} -->
# ${e}

## ${n.DEPENDENCIES}
- ${s}
`}var j=class extends ae.BaseCommand{static paths=[["changelog","check"]];static usage=U.Command.Usage({description:"Validate changelog entries for all version manifests",details:`
      This command validates that:
      - Every release in \`.yarn/versions/*.yml\` has a changelog file
      - Major releases have filled BREAKING CHANGES sections
      - At least one section (Added/Changed/Fixed) has content
    `,examples:[["Validate changelogs","yarn changelog check"]]});verbose=U.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});async execute(){let t=await H.Configuration.find(this.context.cwd,this.context.plugins),{project:o}=await H.Project.find(t,this.context.cwd),s=w.ppath.join(o.cwd,F),i=w.ppath.join(o.cwd,I);if(!await w.xfs.existsPromise(s))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to check.
`),0;let h=(await w.xfs.readdirPromise(s)).filter(c=>c.endsWith(".yml"));if(h.length===0)return this.context.stdout.write(`No version manifests found. Nothing to check.
`),0;let a=[],r=0;for(let c of h){let m=w.ppath.join(s,c),D=await w.xfs.readFilePromise(m,"utf8"),p=V(D,m);this.verbose&&this.context.stdout.write(`Checking manifest: ${c}
`);for(let d of p.releases){let C=L(d.packageName,p.id),g=w.ppath.join(i,C);if(!await w.xfs.existsPromise(g)){a.push(`Missing changelog for ${d.packageName} (manifest: ${p.id}). Run 'yarn changelog create' to generate it.`);continue}let E=await w.xfs.readFilePromise(g,"utf8"),R=A(E),T=G(R,{expectedVersionType:d.versionType});if(T.length>0)for(let b of T)a.push(`${d.packageName} (${C}): ${b}`);else this.verbose&&this.context.stdout.write(`  \u2713 ${d.packageName}
`);r++}}if(a.length>0){this.context.stderr.write(`
Changelog validation failed:

`);for(let c of a)this.context.stderr.write(`  \u2717 ${c}
`);return this.context.stderr.write(`
Found ${a.length} error(s).
`),1}return this.context.stdout.write(`
\u2713 All ${r} changelog(s) are valid.
`),0}};var ce=N("@yarnpkg/cli"),K=N("@yarnpkg/core"),u=N("@yarnpkg/fslib"),v=N("clipanion");var B=class extends ce.BaseCommand{static paths=[["changelog","create"]];static usage=v.Command.Usage({description:"Generate changelog drafts from version manifests",details:`
      This command reads all version manifests in \`.yarn/versions/*.yml\`
      and generates draft changelog files in \`.yarn/changelogs/\`.

      Each draft includes sections for Added, Changed, and Fixed entries.
      For major/minor releases, additional sections are included.

      Existing changelog drafts are not overwritten unless --force is used.

      Use --dependabot to auto-fill changelogs for dependency updates.
      The --message option can provide a custom message (e.g., PR title).
    `,examples:[["Generate changelog drafts","yarn changelog create"],["Regenerate mismatched/invalid changelogs","yarn changelog create --force"],["Generate for Dependabot PR","yarn changelog create --dependabot"],["Generate with custom message",'yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"']]});verbose=v.Option.Boolean("-v,--verbose",!1,{description:"Show verbose output"});force=v.Option.Boolean("-f,--force",!1,{description:"Regenerate changelogs with mismatched version types or invalid entries"});dependabot=v.Option.Boolean("--dependabot",!1,{description:"Auto-fill changelog for dependency updates (Dependabot PRs)"});message=v.Option.String("-m,--message",{description:"Custom message for the changelog entry (used with --dependabot)"});async execute(){let t=await K.Configuration.find(this.context.cwd,this.context.plugins),{project:o}=await K.Project.find(t,this.context.cwd),s=u.ppath.join(o.cwd,F),i=u.ppath.join(o.cwd,I);if(await u.xfs.mkdirPromise(i,{recursive:!0}),!await u.xfs.existsPromise(s))return this.context.stdout.write(`No .yarn/versions directory found. Nothing to do.
`),0;let h=(await u.xfs.readdirPromise(s)).filter(D=>D.endsWith(".yml"));if(h.length===0)return this.context.stdout.write(`No version manifests found. Nothing to do.
`),0;let a=0,r=0,c=0;for(let D of h){let p=u.ppath.join(s,D),d=await u.xfs.readFilePromise(p,"utf8"),C=V(d,p);this.verbose&&this.context.stdout.write(`Processing manifest: ${D}
`);for(let g of C.releases){let E=L(g.packageName,C.id),R=u.ppath.join(i,E);if(await u.xfs.existsPromise(R)){let b=await u.xfs.readFilePromise(R,"utf8"),k=A(b),P=q(k,g.versionType);if(this.force&&P.shouldRegenerate){let x=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await u.xfs.writeFilePromise(R,x);let S=[];P.hasVersionMismatch&&S.push(`${k.versionType} \u2192 ${g.versionType}`),P.contentErrors.length>0&&S.push(...P.contentErrors),this.context.stdout.write(`  Regenerated: ${E} (${S.join(", ")})
`),r++;continue}if(this.verbose)if(P.shouldRegenerate){let x=[];P.hasVersionMismatch&&x.push(`version mismatch: ${k.versionType} vs ${g.versionType}`),P.contentErrors.length>0&&x.push(...P.contentErrors.map(S=>S.toLowerCase())),this.context.stdout.write(`  Skipping ${g.packageName} (${x.join("; ")}, use --force to regenerate)
`)}else this.context.stdout.write(`  Skipping ${g.packageName} (already exists)
`);c++;continue}let T=this.dependabot?te(g.packageName,g.versionType,this.message):ee(g.packageName,g.versionType);await u.xfs.writeFilePromise(R,T),this.context.stdout.write(`  Created: ${E} (${g.versionType})
`),a++}}let m=[`Created ${a}`];return r>0&&m.push(`regenerated ${r}`),m.push(`skipped ${c}`),this.context.stdout.write(`
Done! ${m.join(", ")} changelog draft(s).
`),0}};var ke={commands:[B,j,_]},Oe=ke;return me($e);})();
return plugin;
}
};
