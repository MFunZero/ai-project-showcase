"use strict";
// Fixed excerpts of the local demo verification. This page makes no model or backend requests.
const cases = {
  knowledge: {
    title: "回答有业务资料依据",
    description: "先检索商品和售后资料，再将相关条款组织成回答，并保留引用来源。",
    value: "将企业资料变成可查询的问答入口，并让回答能够回到原文核对。",
    dialogue: [{role:"user",text:"七天无理由退货的运费由谁承担？"},{role:"assistant",text:"无理由退货的退回运费由买家承担。因商品质量问题、发错货或少发漏发导致的退换货，运费由平台承担。[1]\n\n来源示例：退货退款政策 / 退换货运费承担。"}],
    steps: [{title:"检索业务知识",description:"从已入库资料中返回相关候选证据。"},{title:"筛选并组织回答",description:"结合检索与重排结果生成客服回复。"},{title:"保留知识来源",description:"通过引用编号查看对应条款原文。"}]
  },
  logistics: {
    title: "一句话串联两个工具",
    description: "根据订单号查询订单，再使用返回的物流单号查询快递进度。",
    value: "让自然语言请求对应到实际业务接口，减少重复输入与人工跨系统查询。",
    dialogue: [{role:"user",text:"订单 1001 的物流到哪了？"},{role:"assistant",text:"订单 1001：智能猫砂盆\n物流单号：SF213502378238\n当前状态：已揽件\n当前位置：成都\n最新轨迹：成都分拨中心已发出。"}],
    steps: [{title:"查询订单信息",description:"获得商品信息与物流单号。",code:"query_order"},{title:"查询物流进度",description:"使用物流单号获取状态和轨迹。",code:"query_logistics"},{title:"整理查询结果",description:"将接口返回的数据变成清晰的客服回复。"}]
  },
  memory: {
    title: "追问不必重复订单号",
    description: "当前对话中已提到的订单，可以通过“这单”等指代继续查询。",
    value: "支持连续服务对话，让下一句话能够接上前面的业务信息。",
    dialogue: [{role:"user",text:"帮我查询订单 1001 的信息。"},{role:"assistant",text:"订单 1001：智能猫砂盆，已付款，金额 ¥1739。物流单号为 SF213502378238。"},{role:"user",text:"这单的物流到哪了？"},{role:"assistant",text:"您的订单 1001 当前已揽件，当前位置是成都，最新轨迹为成都分拨中心已发出。"}],
    steps: [{title:"保存当前上下文",description:"保留首轮查询中的订单与物流信息。"},{title:"理解后续指代",description:"将“这单”关联到当前会话中的订单 1001。"},{title:"继续业务查询",description:"查询同一订单对应的物流进度。",code:"query_logistics"}]
  },
  refund: {
    title: "把售后问题变成流程",
    description: "先明确要处理的订单，再检索政策并引导用户填写申请。",
    value: "把缺信息的提问、业务核对和申请登记连接起来，同时保留用户选择。",
    dialogue: [{role:"user",text:"我想申请退款，请帮我看看。"},{role:"assistant",text:"请选择您要处理的订单。"},{role:"user",text:"选择订单 1001。"},{role:"assistant",text:"系统结合订单状态与售后政策判断，并提供退款工单入口。用户选择原因后，可登记退款申请。\n\n已验证：申请写入本机数据库。仅登记申请，不执行真实打款。"}],
    steps: [{title:"补齐订单信息",description:"缺少订单时暂停流程，等待用户选择。"},{title:"检索售后政策",description:"将订单信息与对应政策一起交给客服流程处理。"},{title:"登记申请",description:"用户填写原因后创建退款工单，不执行支付退款。"}]
  },
  ticket: {
    title: "确认后再写入工单",
    description: "用户明确要求人工跟进时，先整理问题并展示工单预览。",
    value: "将重要业务写入放在用户确认之后，让流程可控并留下记录。",
    dialogue: [{role:"user",text:"请创建咨询工单，让人工核实订单 1001 的预计送达时间。"},{role:"assistant",text:"请确认工单信息：\n类型：咨询\n问题：核实订单 1001 的预计送达时间。"},{role:"user",text:"确认提交。"},{role:"assistant",text:"已创建工单 T20261014220821001。\n数据库已记录该咨询工单，状态为待处理。当前演示未连接真人坐席。"}],
    steps: [{title:"整理问题",description:"将用户要求转换为工单描述与类型。"},{title:"等待用户确认",description:"展示预览，确认或取消后继续流程。"},{title:"写入并返回单号",description:"确认后创建工单，返回本机数据库中的真实记录。",code:"create_ticket"}]
  }
};

function showCase(id, shouldScroll = false) {
  const data = cases[id];
  if (!data) return;
  document.querySelectorAll('.case-tabs button').forEach(button => {
    const active = button.dataset.case === id;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.getElementById('case-panel').setAttribute('aria-labelledby', 'tab-' + id);
  document.getElementById('case-title').textContent = data.title;
  document.getElementById('case-description').textContent = data.description;
  document.getElementById('case-value').textContent = data.value;
  const dialogue = document.getElementById('case-dialogue');
  dialogue.replaceChildren();
  data.dialogue.forEach(message => {
    const row = document.createElement('div'); row.className = 'dialogue-row ' + message.role;
    const label = document.createElement('span'); label.className = 'dialogue-label'; label.textContent = message.role === 'user' ? '用户提问或操作' : '演示结果摘录';
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = message.text;
    row.append(label, bubble); dialogue.appendChild(row);
  });
  const steps = document.getElementById('case-steps'); steps.replaceChildren();
  data.steps.forEach(step => {
    const item = document.createElement('div'); item.className = 'step';
    const title = document.createElement('strong'); title.textContent = step.title;
    const paragraph = document.createElement('p'); paragraph.textContent = step.description;
    item.append(title, paragraph);
    if (step.code) { const code = document.createElement('code'); code.textContent = step.code; item.appendChild(code); }
    steps.appendChild(item);
  });
  if (shouldScroll) document.getElementById('cases').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
}
document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => showCase(button.dataset.case, !button.closest('.case-tabs'))));
const tabs = Array.from(document.querySelectorAll('.case-tabs button'));
tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
  let next;
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault(); showCase(tabs[next].dataset.case); tabs[next].focus();
}));
const screenshotDialog = document.getElementById('screenshot-dialog');
document.getElementById('open-screenshot').addEventListener('click', () => screenshotDialog.showModal());
document.getElementById('close-screenshot').addEventListener('click', () => screenshotDialog.close());
screenshotDialog.addEventListener('click', event => {
  if (event.target !== screenshotDialog) return;
  const bounds = screenshotDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) screenshotDialog.close();
});
document.getElementById('copy-link').addEventListener('click', async () => {
  const status = document.getElementById('share-status');
  try { await navigator.clipboard.writeText(location.href.split('#')[0]); status.textContent = '链接已复制，可以直接转发。'; }
  catch { status.textContent = '请复制浏览器地址栏中的网页链接。'; }
});
showCase('knowledge');
