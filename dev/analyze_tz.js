// 分析时区偏移量
const TIMEZONES = [
  { label: '本地时区', labelEn: 'Local', value: '' },
  { label: 'UTC 协调世界时', labelEn: 'UTC', value: 'UTC' },
  { label: '北京 / 上海（中国）', labelEn: 'Beijing/Shanghai', value: 'Asia/Shanghai' },
  { label: '香港', labelEn: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '台北', labelEn: 'Taipei', value: 'Asia/Taipei' },
  { label: '东京（日本）', labelEn: 'Tokyo', value: 'Asia/Tokyo' },
  { label: '首尔（韩国）', labelEn: 'Seoul', value: 'Asia/Seoul' },
  { label: '新加坡', labelEn: 'Singapore', value: 'Asia/Singapore' },
  { label: '曼谷（泰国）', labelEn: 'Bangkok', value: 'Asia/Bangkok' },
  { label: '迪拜', labelEn: 'Dubai', value: 'Asia/Dubai' },
  { label: '孟买（印度）', labelEn: 'Kolkata', value: 'Asia/Kolkata' },
  { label: '莫斯科（俄罗斯）', labelEn: 'Moscow', value: 'Europe/Moscow' },
  { label: '伦敦（英国）', labelEn: 'London', value: 'Europe/London' },
  { label: '巴黎（法国）', labelEn: 'Paris', value: 'Europe/Paris' },
  { label: '柏林（德国）', labelEn: 'Berlin', value: 'Europe/Berlin' },
  { label: '纽约（美国东部）', labelEn: 'New York', value: 'America/New_York' },
  { label: '芝加哥（美国中部）', labelEn: 'Chicago', value: 'America/Chicago' },
  { label: '丹佛（美国山地）', labelEn: 'Denver', value: 'America/Denver' },
  { label: '洛杉矶（美国西部）', labelEn: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: '悉尼（澳大利亚）', labelEn: 'Sydney', value: 'Australia/Sydney' },
  { label: '奥克兰（新西兰）', labelEn: 'Auckland', value: 'Pacific/Auckland' },
];

function offsetMinutes(date, tz) {
  if (!tz || tz === '' || tz === 'Local') return new Date(date).getTimezoneOffset();
  if (tz === 'UTC') return 0;
  try {
    const utcDate = new Date(date).toLocaleString('en-US', {timeZone: tz});
    const localDate = new Date(date).toLocaleString();
    const utc = new Date(utcDate).getTime();
    const local = new Date(localDate).getTime();
    return Math.round((utc - local) / 60000);
  } catch (e) {
    return 0;
  }
}

function currentOffsetStr(tz) {
  const mins = offsetMinutes(new Date(), tz);
  if (mins === 0) return '+00:00';
  const sign = mins > 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `${sign}${Math.floor(a / 60).toString().padStart(2, '0')}:${(a % 60).toString().padStart(2, '0')}`;
}

const offsets = {};
TIMEZONES.forEach(tz => {
  if (tz.value && tz.value !== 'UTC') {
    const mins = offsetMinutes(new Date(), tz.value);
    const offsetStr = currentOffsetStr(tz.value);
    if (!offsets[offsetStr]) {
      offsets[offsetStr] = [];
    }
    offsets[offsetStr].push(tz.label);
  }
});

console.log('时区偏移量分析:');
Object.keys(offsets).sort().forEach(offset => {
  console.log(`${offset}: ${offsets[offset].join(', ')}`);
});

const duplicateOffsets = Object.keys(offsets).filter(offset => offsets[offset].length > 1);
if (duplicateOffsets.length > 0) {
  console.log('\n发现重复偏移量的时区:');
  duplicateOffsets.forEach(offset => {
    console.log(`${offset}: ${offsets[offset].join(', ')}`);
  });
} else {
  console.log('\n没有发现重复偏移量的时区');
}