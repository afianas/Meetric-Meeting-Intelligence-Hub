export const MEETINGS = [
  { id:1, name:"Q3 Product Roadmap Review",  date:"2024-07-10", speakers:5, words:12400, sentiment:72, color:"#16a34a", project:"Product Team"  },
  { id:2, name:"API Launch Strategy",         date:"2024-07-08", speakers:4, words:8900,  sentiment:48, color:"#d97706", project:"Engineering"   },
  { id:3, name:"Finance Lead Sync — Budget",  date:"2024-07-05", speakers:3, words:6200,  sentiment:31, color:"#dc2626", project:"Finance"        },
  { id:4, name:"Design System Kickoff",       date:"2024-07-03", speakers:6, words:15100, sentiment:85, color:"#7c3aed", project:"Design"         },
  { id:5, name:"Client Onboarding Review",    date:"2024-06-28", speakers:4, words:9300,  sentiment:61, color:"#0891b2", project:"Client Success" },
];

export const DECISIONS = [
  { id:1, meeting:"API Launch Strategy",        date:"Jul 8",  content:"Delay API launch to Q4 pending security audit.", speaker:"Alex M.",  initials:"AM", timestamp:"05:10", quote:"Okay, decision made. Q4 it is. We can't ship without the audit and Jordan's docs aren't ready.", highlight:"Q4 it is", context:"3-min debate between Sam R. and Jordan D. All 4 attendees agreed.", reasons:["Audit incomplete","Docs 60% done","Enterprise risk"] },
  { id:2, meeting:"Q3 Product Roadmap Review",  date:"Jul 10", content:"Adopt React as primary frontend framework for 2024.", speaker:"Taylor M.", initials:"TM", timestamp:"22:34", quote:"We've evaluated Vue and Svelte but ecosystem maturity and team familiarity make React the clear choice. React across the board for 2024.", highlight:"React across the board", context:"15-min framework comparison. Vue main contender. 5/5 agreed.", reasons:["Team familiarity","Ecosystem","Existing library"] },
  { id:3, meeting:"Design System Kickoff",      date:"Jul 3",  content:"Freeze all design tokens until August sprint review.", speaker:"KL", initials:"KL", timestamp:"08:45", quote:"Tokens are frozen as of today. No changes until August sprint review — this is non-negotiable.", highlight:"Tokens are frozen", context:"Unanimous — prevent scope creep during active migration.", reasons:["Prevent instability","Active migration","August deadline"] },
  { id:4, meeting:"Client Onboarding Review",   date:"Jun 28", content:"Proceed with enterprise tier at $499/month.", speaker:"Taylor M.", initials:"TM", timestamp:"31:45", quote:"Three beta accounts have already said $499 is workable. Lock it in and move forward.", highlight:"Lock it in", context:"Pricing under review 2 weeks. Beta client feedback was deciding factor.", reasons:["3 betas confirmed","Competitive analysis","2-week delay"] },
  { id:5, meeting:"Finance Lead Sync — Budget", date:"Jul 5",  content:"Freeze non-essential spending until Q4 forecasts revised.", speaker:"Sam R.", initials:"SR", timestamp:"14:22", quote:"We cannot approve further spend until we understand the Q2 variance. That 12% gap needs an owner before another dollar goes out.", highlight:"12% gap needs an owner", context:"Finance Lead imposed immediate freeze. TM assigned variance report by Jul 14.", reasons:["12% Q2 variance","Unowned contracts","Q4 forecast pending"] },
];

export const INIT_ACTIONS = [
  { id:1, content:"Prepare complete API docs and migration guide.", who:"JD", deadline:"Jul 15", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:2, content:"Schedule security audit with third-party vendor.", who:"SR", deadline:"Jul 12", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:3, content:"Compile competitor analysis report for the board.", who:"AM", deadline:"Jul 20", meeting:"Q3 Product Roadmap Review", urgent:false, done:false },
  { id:4, content:"Set up bi-weekly sync for roadmap check-ins.", who:"PK", deadline:"Jul 17", meeting:"Q3 Product Roadmap Review", urgent:false, done:true },
  { id:5, content:"Migrate legacy color variables to new token system.", who:"KL", deadline:"Jul 18", meeting:"Design System Kickoff", urgent:false, done:false },
  { id:6, content:"Present budget variance report to Finance Lead.", who:"TM", deadline:"Jul 14", meeting:"Finance Lead Sync — Budget", urgent:true, done:false },
  { id:7, content:"Set up onboarding checklist automation in CRM.", who:"BN", deadline:"Jul 22", meeting:"Client Onboarding Review", urgent:false, done:true },
  { id:8, content:"Draft client email for enterprise accounts.", who:"TM", deadline:"Jul 11", meeting:"API Launch Strategy", urgent:true, done:false },
  { id:9, content:"Review and sign off on vendor contract terms.", who:"SR", deadline:"Jul 25", meeting:"Finance Lead Sync — Budget", urgent:false, done:false },
  { id:10, content:"Circulate updated roadmap to all stakeholders.", who:"AM", deadline:"Jul 16", meeting:"Q3 Product Roadmap Review", urgent:false, done:false },
];

export const SCOPED_QA = {
  "API Launch Strategy": {
    "Why was the launch delayed?": { text:"Delayed to Q4: security audit not completed, migration docs 60% done (Jordan D.), enterprise clients needed more beta time. Decision at 05:10 by Alex M.", citation:{segment:"03:00 — 05:10",speakers:["Sam R.","Alex M.","Jordan D."],excerpt:'"I cannot sign off on this timeline." — Sam R. | "Q4 it is." — Alex M.'} },
    "Who owns the action items?": { text:"Jordan D. — API docs, Jul 15 [URGENT]. Sam R. — vendor audit contact, Jul 12 [URGENT]. Both flagged critical.", citation:{segment:"05:10",speakers:["Alex M."],excerpt:'"Jordan — API docs by July 15th. Sam — vendor contact by July 12th."'} },
    "What was Sam's concern?": { text:"Sam flagged the security audit as a hard blocker — minimum 3 weeks, couldn't sign off earlier. Primary driver of the Q4 decision.", citation:{segment:"01:30 — 03:00",speakers:["Sam R."],excerpt:'"I cannot sign off on this timeline. Three weeks minimum."'} },
  },
  "Q3 Product Roadmap Review": {
    "What framework was chosen?": { text:"React chosen unanimously. Vue and Svelte evaluated but React won on ecosystem maturity and team familiarity.", citation:{segment:"22:34",speakers:["Taylor M."],excerpt:'"React across the board for 2024."'} },
  },
  "Finance Lead Sync — Budget": {
    "What were the main concerns?": { text:"12% Q2 variance, ~$340K unowned vendor contracts, and immediate spend freeze until Q4 forecasts revised.", citation:{segment:"12:00 — 19:30",speakers:["Sam R."],excerpt:'"That 12% gap needs an owner before another dollar goes out."'} },
  },
  "Design System Kickoff": {
    "What was decided about tokens?": { text:"All tokens frozen immediately — no changes until August sprint review. Unanimous.", citation:{segment:"08:45",speakers:["KL"],excerpt:'"Tokens are frozen as of today. Non-negotiable."'} },
  },
  "Client Onboarding Review": {
    "What pricing was agreed?": { text:"Enterprise tier confirmed at $499/month. Three beta clients had already verbally agreed.", citation:{segment:"31:45",speakers:["Taylor M."],excerpt:'"Lock it in and move forward."'} },
  },
};

export const GLOBAL_QA = {
  "Why did we delay the API launch?": { text:"Pushed to Q4: audit incomplete, migration docs 60%, enterprise clients needed more time.", citation:{meeting:"API Launch Strategy",date:"Jul 8, 2024",segment:"03:00 — 05:10",speakers:["Sam R.","Alex M."],excerpt:'"Q4 it is." — Alex M.'} },
  "What were Finance's main concerns?": { text:"12% Q2 budget variance, unowned $340K vendor contracts, spend freeze pending Q4 forecasts.", citation:{meeting:"Finance Lead Sync",date:"Jul 5, 2024",segment:"12:00 — 19:30",speakers:["Sam R."],excerpt:'"That 12% gap needs an owner before another dollar goes out."'} },
  "What is the overall sentiment?": { text:"Average 59% across 5 meetings. Design Kickoff highest (85%), Finance Sync lowest (31%).", citation:{meeting:"All meetings",date:"Jun 28 — Jul 10",segment:"Full corpus",speakers:["Multiple"],excerpt:'Conflict peaks: Finance Sync 23:40, API Launch 01:30.'} },
  "What pricing was decided?": { text:"Enterprise tier locked at $499/mo in Client Onboarding Review — confirmed by 3 beta clients.", citation:{meeting:"Client Onboarding Review",date:"Jun 28, 2024",segment:"31:45",speakers:["Taylor M."],excerpt:'"Lock it in and move forward."'} },
  "When is the next deadline?": { text:"Jul 12 — Sam R. vendor audit [URGENT]. Jul 14 — TM budget report. Jul 15 — Jordan D. API docs [URGENT].", citation:{meeting:"API Launch + Finance Sync",date:"Jul 5–8",segment:"Action item extraction",speakers:["Alex M."],excerpt:'Deadlines assigned at close of both sessions.'} },
};

export const SPEAKERS_SENT = [
  {name:"Alex M.",  score:78,bars:[3,5,8,6,7,4,9],ring:"#16a34a",ringBg:"rgba(22,163,74,0.1)"},
  {name:"Jordan D.",score:52,bars:[6,4,3,7,5,6,4],ring:"#d97706",ringBg:"rgba(217,119,6,0.1)"},
  {name:"Sam R.",   score:31,bars:[8,6,5,4,3,5,2],ring:"#dc2626",ringBg:"rgba(220,38,38,0.1)"},
  {name:"Taylor M.",score:65,bars:[4,5,7,6,8,5,7],ring:"#7c3aed",ringBg:"rgba(124,58,237,0.1)"},
];

export const TL_DATA = [
  {speaker:"Alex M.",  segs:[{t:"pos",w:20},{t:"neu",w:15},{t:"enthus",w:10},{t:"pos",w:20},{t:"neu",w:10},{t:"pos",w:25}]},
  {speaker:"Jordan D.",segs:[{t:"neu",w:15},{t:"neg",w:12},{t:"neu",w:18},{t:"pos",w:15},{t:"neg",w:10},{t:"neu",w:30}]},
  {speaker:"Sam R.",   segs:[{t:"neg",w:10},{t:"conflict",w:15},{t:"neg",w:10},{t:"neu",w:20},{t:"conflict",w:15},{t:"neg",w:30}]},
  {speaker:"Taylor M.",segs:[{t:"pos",w:25},{t:"enthus",w:15},{t:"pos",w:20},{t:"neu",w:15},{t:"pos",w:15},{t:"neu",w:10}]},
];

export const TIME_TICKS = ["0:00","10:00","20:00","30:00","40:00","50:00","60:00"];

export const SEG_TEXTS = {
  pos:"Largely aligned. Clear enthusiasm — no pushback from either side.",
  neg:"Visible hesitation. Timeline concerns surfaced, energy shifted downward.",
  neu:"Clarifying questions and factual exchange. No strong opinions — information mode.",
  conflict:'"I cannot sign off on this timeline. Three weeks minimum." The room went quiet.',
  enthus:'"This is exactly the bold move we\'ve been waiting to make." High momentum.',
};

export const DEMO_FILES = [
  {name:"q3_roadmap_review.txt",  size:248,status:"done",progress:100,project:"Product Team",date:"2024-07-10",speakers:5,words:12400},
  {name:"api_launch_strategy.vtt",size:172,status:"done",progress:100,project:"Engineering", date:"2024-07-08",speakers:4,words:8900},
  {name:"finance_sync_july.txt",  size:119,status:"done",progress:100,project:"Finance",     date:"2024-07-05",speakers:3,words:6200},
];
