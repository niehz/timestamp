// ========================================================
// js/core.js — 基础工具/常量、i18n 数据、系统设置、时区数据与配置 UI
// Extracted from index.js (lines 1-1141) by
// dev/scripts/split.mjs. Loaded from index.html in this order:
// core → datetime → fields → calendar → convert → tzselector → events
// ========================================================

const $ = (s) => document.querySelector(s);

const MIN_TS = -8640000000000000;
const MAX_TS = 8640000000000000;

const WEEK_CN = { Sun: '周日', Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六' };

const DEFAULT_TZ_LIST = [
  { label: '檀香山', labelEn: 'Honolulu', value: 'Pacific/Honolulu' },
  { label: '洛杉矶', labelEn: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: '丹佛', labelEn: 'Denver', value: 'America/Denver' },
  { label: '芝加哥', labelEn: 'Chicago', value: 'America/Chicago' },
  { label: '纽约', labelEn: 'New York', value: 'America/New_York' },
  { label: '圣保罗', labelEn: 'Sao Paulo', value: 'America/Sao_Paulo' },
  { label: '世界协调时', labelEn: 'UTC', value: 'UTC' },
  { label: '伦敦', labelEn: 'London', value: 'Europe/London' },
  { label: '巴黎', labelEn: 'Paris', value: 'Europe/Paris' },
  { label: '开罗', labelEn: 'Cairo', value: 'Africa/Cairo' },
  { label: '莫斯科', labelEn: 'Moscow', value: 'Europe/Moscow' },
  { label: '迪拜', labelEn: 'Dubai', value: 'Asia/Dubai' },
  { label: '卡拉奇', labelEn: 'Karachi', value: 'Asia/Karachi' },
  { label: '新德里', labelEn: 'Delhi', value: 'Asia/Kolkata' },
  { label: '达卡', labelEn: 'Dhaka', value: 'Asia/Dhaka' },
  { label: '曼谷', labelEn: 'Bangkok', value: 'Asia/Bangkok' },
  { label: '北京', labelEn: 'Beijing', value: 'Asia/Shanghai' },
  { label: '东京', labelEn: 'Tokyo', value: 'Asia/Tokyo' },
  { label: '悉尼', labelEn: 'Sydney', value: 'Australia/Sydney' },
  { label: '奥克兰', labelEn: 'Auckland', value: 'Pacific/Auckland' },
];

const ALL_TIMEZONES = [
  { label: '纽埃', labelEn: 'Niue', value: 'Pacific/Niue' },
  { label: '帕果帕果', labelEn: 'Pago Pago', value: 'Pacific/Pago_Pago' },
  { label: '中途岛', labelEn: 'Midway', value: 'Pacific/Midway' },
  { label: '檀香山', labelEn: 'Honolulu', value: 'Pacific/Honolulu' },
  { label: '拉罗汤加', labelEn: 'Rarotonga', value: 'Pacific/Rarotonga' },
  { label: '塔希提', labelEn: 'Tahiti', value: 'Pacific/Tahiti' },
  { label: '约翰斯顿', labelEn: 'Johnston', value: 'Pacific/Johnston' },
  { label: '马克萨斯', labelEn: 'Marquesas', value: 'Pacific/Marquesas' },
  { label: '埃达克', labelEn: 'Adak', value: 'America/Adak' },
  { label: '甘比尔', labelEn: 'Gambier', value: 'Pacific/Gambier' },
  { label: '安克雷奇', labelEn: 'Anchorage', value: 'America/Anchorage' },
  { label: '梅特拉卡特拉', labelEn: 'Metlakatla', value: 'America/Metlakatla' },
  { label: '诺姆', labelEn: 'Nome', value: 'America/Nome' },
  { label: '皮特凯恩', labelEn: 'Pitcairn', value: 'Pacific/Pitcairn' },
  { label: '锡特卡', labelEn: 'Sitka', value: 'America/Sitka' },
  { label: '亚库塔特', labelEn: 'Yakutat', value: 'America/Yakutat' },
  { label: '朱诺', labelEn: 'Juneau', value: 'America/Juneau' },
  { label: '埃莫西约', labelEn: 'Hermosillo', value: 'America/Hermosillo' },
  { label: '道森', labelEn: 'Dawson', value: 'America/Dawson' },
  { label: '道森克里克', labelEn: 'Dawson Creek', value: 'America/Dawson_Creek' },
  { label: '蒂华纳', labelEn: 'Tijuana', value: 'America/Tijuana' },
  { label: '凤凰城', labelEn: 'Phoenix', value: 'America/Phoenix' },
  { label: '怀特霍斯', labelEn: 'Whitehorse', value: 'America/Whitehorse' },
  { label: '克雷斯顿', labelEn: 'Creston', value: 'America/Creston' },
  { label: '纳尔逊堡', labelEn: 'Fort Nelson', value: 'America/Fort_Nelson' },
  { label: '温哥华', labelEn: 'Vancouver', value: 'America/Vancouver' },
  { label: '洛杉矶', labelEn: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: '埃德蒙顿', labelEn: 'Edmonton', value: 'America/Edmonton' },
  { label: '黄刀镇', labelEn: 'Yellowknife', value: 'America/Yellowknife' },
  { label: '奥希纳加', labelEn: 'Ojinaga', value: 'America/Ojinaga' },
  { label: '伯利兹', labelEn: 'Belize', value: 'America/Belize' },
  { label: '博伊西', labelEn: 'Boise', value: 'America/Boise' },
  { label: '复活节岛', labelEn: 'Easter', value: 'Pacific/Easter' },
  { label: '哥斯达黎加', labelEn: 'Costa Rica', value: 'America/Costa_Rica' },
  { label: '剑桥湾', labelEn: 'Cambridge Bay', value: 'America/Cambridge_Bay' },
  { label: '科隆群岛', labelEn: 'Galapagos', value: 'Pacific/Galapagos' },
  { label: '丹佛', labelEn: 'Denver', value: 'America/Denver' },
  { label: '里贾纳', labelEn: 'Regina', value: 'America/Regina' },
  { label: '马那瓜', labelEn: 'Managua', value: 'America/Managua' },
  { label: '马萨特兰', labelEn: 'Mazatlan', value: 'America/Mazatlan' },
  { label: '奇瓦瓦', labelEn: 'Chihuahua', value: 'America/Chihuahua' },
  { label: '萨尔瓦多', labelEn: 'El Salvador', value: 'America/El_Salvador' },
  { label: '斯威夫特卡伦特', labelEn: 'Swift Current', value: 'America/Swift_Current' },
  { label: '特古西加尔巴', labelEn: 'Tegucigalpa', value: 'America/Tegucigalpa' },
  { label: '危地马拉', labelEn: 'Guatemala', value: 'America/Guatemala' },
  { label: '伊努维克', labelEn: 'Inuvik', value: 'America/Inuvik' },
  { label: '阿蒂科肯', labelEn: 'Coral Harbour', value: 'America/Coral_Harbour' },
  { label: '巴拿马', labelEn: 'Panama', value: 'America/Panama' },
  { label: '巴伊亚班德拉斯', labelEn: 'Bahia Banderas', value: 'America/Bahia_Banderas' },
  { label: '芝加哥', labelEn: 'Chicago', value: 'America/Chicago' },
  { label: '波哥大', labelEn: 'Bogota', value: 'America/Bogota' },
  { label: '瓜亚基尔', labelEn: 'Guayaquil', value: 'America/Guayaquil' },
  { label: '开曼', labelEn: 'Cayman', value: 'America/Cayman' },
  { label: '坎昆', labelEn: 'Cancun', value: 'America/Cancun' },
  { label: '兰今湾', labelEn: 'Rankin Inlet', value: 'America/Rankin_Inlet' },
  { label: '雷索卢特', labelEn: 'Resolute', value: 'America/Resolute' },
  { label: '里奥布郎库', labelEn: 'Rio Branco', value: 'America/Rio_Branco' },
  { label: '利马', labelEn: 'Lima', value: 'America/Lima' },
  { label: '马塔莫罗斯', labelEn: 'Matamoros', value: 'America/Matamoros' },
  { label: '梅里达', labelEn: 'Merida', value: 'America/Merida' },
  { label: '梅诺米尼', labelEn: 'Menominee', value: 'America/Menominee' },
  { label: '蒙特雷', labelEn: 'Monterrey', value: 'America/Monterrey' },
  { label: '墨西哥城', labelEn: 'Mexico City', value: 'America/Mexico_City' },
  { label: '温尼伯', labelEn: 'Winnipeg', value: 'America/Winnipeg' },
  { label: '牙买加', labelEn: 'Jamaica', value: 'America/Jamaica' },
  { label: '依伦尼贝', labelEn: 'Eirunepe', value: 'America/Eirunepe' },
  { label: '印第安纳州诺克斯', labelEn: 'Indiana/Knox', value: 'America/Indiana/Knox' },
  { label: '印第安纳州特尔城', labelEn: 'Indiana/Tell City', value: 'America/Indiana/Tell_City' },
  { label: '纽约', labelEn: 'New York', value: 'America/New_York' },
  { label: '阿鲁巴', labelEn: 'Aruba', value: 'America/Aruba' },
  { label: '安圭拉', labelEn: 'Anguilla', value: 'America/Anguilla' },
  { label: '安提瓜', labelEn: 'Antigua', value: 'America/Antigua' },
  { label: '巴巴多斯', labelEn: 'Barbados', value: 'America/Barbados' },
  { label: '波多黎各', labelEn: 'Puerto Rico', value: 'America/Puerto_Rico' },
  { label: '底特律', labelEn: 'Detroit', value: 'America/Detroit' },
  { label: '多伦多', labelEn: 'Toronto', value: 'America/Toronto' },
  { label: '多米尼加', labelEn: 'Dominica', value: 'America/Dominica' },
  { label: '格林纳达', labelEn: 'Grenada', value: 'America/Grenada' },
  { label: '哈瓦那', labelEn: 'Havana', value: 'America/Havana' },
  { label: '加拉加斯', labelEn: 'Caracas', value: 'America/Caracas' },
  { label: '拉巴斯', labelEn: 'La Paz', value: 'America/La_Paz' },
  { label: '路易斯维尔', labelEn: 'Louisville', value: 'America/Louisville' },
  { label: '马瑙斯', labelEn: 'Manaus', value: 'America/Manaus' },
  { label: '拿骚', labelEn: 'Nassau', value: 'America/Nassau' },
  { label: '圣地亚哥', labelEn: 'Santiago', value: 'America/Santiago' },
  { label: '圣多明各', labelEn: 'Santo Domingo', value: 'America/Santo_Domingo' },
  { label: '太子港', labelEn: 'Port-au-Prince', value: 'America/Port-au-Prince' },
  { label: '亚松森', labelEn: 'Asuncion', value: 'America/Asuncion' },
  { label: '印第安纳波利斯', labelEn: 'Indianapolis', value: 'America/Indianapolis' },
  { label: '大坎普', labelEn: 'Campo Grande', value: 'America/Campo_Grande' },
  { label: '库亚巴', labelEn: 'Cuiaba', value: 'America/Cuiaba' },
  { label: '圣保罗', labelEn: 'Sao Paulo', value: 'America/Sao_Paulo' },
  { label: '阿拉瓜伊纳', labelEn: 'Araguaina', value: 'America/Araguaina' },
  { label: '巴伊亚', labelEn: 'Bahia', value: 'America/Bahia' },
  { label: '贝伦', labelEn: 'Belem', value: 'America/Belem' },
  { label: '布宜诺斯艾利斯', labelEn: 'Buenos Aires', value: 'America/Buenos_Aires' },
  { label: '福塔雷萨', labelEn: 'Fortaleza', value: 'America/Fortaleza' },
  { label: '哈利法克斯', labelEn: 'Halifax', value: 'America/Halifax' },
  { label: '卡宴', labelEn: 'Cayenne', value: 'America/Cayenne' },
  { label: '累西腓', labelEn: 'Recife', value: 'America/Recife' },
  { label: '马塞约', labelEn: 'Maceio', value: 'America/Maceio' },
  { label: '蒙得维的亚', labelEn: 'Montevideo', value: 'America/Montevideo' },
  { label: '蒙克顿', labelEn: 'Moncton', value: 'America/Moncton' },
  { label: '帕拉马里博', labelEn: 'Paramaribo', value: 'America/Paramaribo' },
  { label: '蓬塔阿雷纳斯', labelEn: 'Punta Arenas', value: 'America/Punta_Arenas' },
  { label: '圣胡安', labelEn: 'San Juan', value: 'America/Argentina/San_Juan' },
  { label: '乌斯怀亚', labelEn: 'Ushuaia', value: 'America/Argentina/Ushuaia' },
  { label: '圣约翰斯', labelEn: 'St Johns', value: 'America/St_Johns' },
  { label: '百慕大', labelEn: 'Bermuda', value: 'Atlantic/Bermuda' },
  { label: '格莱斯贝', labelEn: 'Glace Bay', value: 'America/Glace_Bay' },
  { label: '古斯湾', labelEn: 'Goose Bay', value: 'America/Goose_Bay' },
  { label: '洛罗尼亚', labelEn: 'Noronha', value: 'America/Noronha' },
  { label: '南乔治亚', labelEn: 'South Georgia', value: 'Atlantic/South_Georgia' },
  { label: '努克', labelEn: 'Godthab', value: 'America/Godthab' },
  { label: '斯坦利', labelEn: 'Stanley', value: 'Atlantic/Stanley' },
  { label: '图勒', labelEn: 'Thule', value: 'America/Thule' },
  { label: '佛得角', labelEn: 'Cape Verde', value: 'Atlantic/Cape_Verde' },
  { label: '雷克雅未克', labelEn: 'Reykjavik', value: 'Atlantic/Reykjavik' },
  { label: '世界协调时', labelEn: 'UTC', value: 'UTC' },
  { label: '阿比让', labelEn: 'Abidjan', value: 'Africa/Abidjan' },
  { label: '阿克拉', labelEn: 'Accra', value: 'Africa/Accra' },
  { label: '巴马科', labelEn: 'Bamako', value: 'Africa/Bamako' },
  { label: '达喀尔', labelEn: 'Dakar', value: 'Africa/Dakar' },
  { label: '弗里敦', labelEn: 'Freetown', value: 'Africa/Freetown' },
  { label: '蒙罗维亚', labelEn: 'Monrovia', value: 'Africa/Monrovia' },
  { label: '圣多美', labelEn: 'Sao Tome', value: 'Africa/Sao_Tome' },
  { label: '亚速尔群岛', labelEn: 'Azores', value: 'Atlantic/Azores' },
  { label: '阿尔及尔', labelEn: 'Algiers', value: 'Africa/Algiers' },
  { label: '都柏林', labelEn: 'Dublin', value: 'Europe/Dublin' },
  { label: '里斯本', labelEn: 'Lisbon', value: 'Europe/Lisbon' },
  { label: '伦敦', labelEn: 'London', value: 'Europe/London' },
  { label: '卡萨布兰卡', labelEn: 'Casablanca', value: 'Africa/Casablanca' },
  { label: '拉各斯', labelEn: 'Lagos', value: 'Africa/Lagos' },
  { label: '突尼斯', labelEn: 'Tunis', value: 'Africa/Tunis' },
  { label: '柏林', labelEn: 'Berlin', value: 'Europe/Berlin' },
  { label: '阿姆斯特丹', labelEn: 'Amsterdam', value: 'Europe/Amsterdam' },
  { label: '贝尔格莱德', labelEn: 'Belgrade', value: 'Europe/Belgrade' },
  { label: '布达佩斯', labelEn: 'Budapest', value: 'Europe/Budapest' },
  { label: '布拉格', labelEn: 'Prague', value: 'Europe/Prague' },
  { label: '布鲁塞尔', labelEn: 'Brussels', value: 'Europe/Brussels' },
  { label: '哥本哈根', labelEn: 'Copenhagen', value: 'Europe/Copenhagen' },
  { label: '华沙', labelEn: 'Warsaw', value: 'Europe/Warsaw' },
  { label: '巴黎', labelEn: 'Paris', value: 'Europe/Paris' },
  { label: '罗马', labelEn: 'Rome', value: 'Europe/Rome' },
  { label: '马德里', labelEn: 'Madrid', value: 'Europe/Madrid' },
  { label: '斯德哥尔摩', labelEn: 'Stockholm', value: 'Europe/Stockholm' },
  { label: '维也纳', labelEn: 'Vienna', value: 'Europe/Vienna' },
  { label: '苏黎世', labelEn: 'Zurich', value: 'Europe/Zurich' },
  { label: '加里宁格勒', labelEn: 'Kaliningrad', value: 'Europe/Kaliningrad' },
  { label: '的地黎波里', labelEn: 'Tripoli', value: 'Africa/Tripoli' },
  { label: '哈拉雷', labelEn: 'Harare', value: 'Africa/Harare' },
  { label: '约翰内斯堡', labelEn: 'Johannesburg', value: 'Africa/Johannesburg' },
  { label: '开罗', labelEn: 'Cairo', value: 'Africa/Cairo' },
  { label: '雅典', labelEn: 'Athens', value: 'Europe/Athens' },
  { label: '布加勒斯特', labelEn: 'Bucharest', value: 'Europe/Bucharest' },
  { label: '赫尔辛基', labelEn: 'Helsinki', value: 'Europe/Helsinki' },
  { label: '基希讷乌', labelEn: 'Chisinau', value: 'Europe/Chisinau' },
  { label: '塔林', labelEn: 'Tallinn', value: 'Europe/Tallinn' },
  { label: '维尔纽斯', labelEn: 'Vilnius', value: 'Europe/Vilnius' },
  { label: '伊斯坦布尔', labelEn: 'Istanbul', value: 'Europe/Istanbul' },
  { label: '索非亚', labelEn: 'Sofia', value: 'Europe/Sofia' },
  { label: '耶路撒冷', labelEn: 'Jerusalem', value: 'Asia/Jerusalem' },
  { label: '基辅', labelEn: 'Kiev', value: 'Europe/Kiev' },
  { label: '莫斯科', labelEn: 'Moscow', value: 'Europe/Moscow' },
  { label: '明斯克', labelEn: 'Minsk', value: 'Europe/Minsk' },
  { label: '伏尔加格勒', labelEn: 'Volgograd', value: 'Europe/Volgograd' },
  { label: '萨马拉', labelEn: 'Samara', value: 'Europe/Samara' },
  { label: '迪拜', labelEn: 'Dubai', value: 'Asia/Dubai' },
  { label: '巴库', labelEn: 'Baku', value: 'Asia/Baku' },
  { label: '第比利斯', labelEn: 'Tbilisi', value: 'Asia/Tbilisi' },
  { label: '埃里温', labelEn: 'Yerevan', value: 'Asia/Yerevan' },
  { label: '马斯喀特', labelEn: 'Muscat', value: 'Asia/Muscat' },
  { label: '萨拉托夫', labelEn: 'Saratov', value: 'Europe/Saratov' },
  { label: '德黑兰', labelEn: 'Tehran', value: 'Asia/Tehran' },
  { label: '喀布尔', labelEn: 'Kabul', value: 'Asia/Kabul' },
  { label: '卡拉奇', labelEn: 'Karachi', value: 'Asia/Karachi' },
  { label: '塔什干', labelEn: 'Tashkent', value: 'Asia/Tashkent' },
  { label: '叶卡捷琳堡', labelEn: 'Yekaterinburg', value: 'Asia/Yekaterinburg' },
  { label: '新德里', labelEn: 'Delhi', value: 'Asia/Kolkata' },
  { label: '科伦坡', labelEn: 'Colombo', value: 'Asia/Colombo' },
  { label: '加德满都', labelEn: 'Katmandu', value: 'Asia/Katmandu' },
  { label: '加尔各答', labelEn: 'Calcutta', value: 'Asia/Calcutta' },
  { label: '阿拉木图', labelEn: 'Almaty', value: 'Asia/Almaty' },
  { label: '比什凯克', labelEn: 'Bishkek', value: 'Asia/Bishkek' },
  { label: '达卡', labelEn: 'Dhaka', value: 'Asia/Dhaka' },
  { label: '鄂木斯克', labelEn: 'Omsk', value: 'Asia/Omsk' },
  { label: '乌鲁木齐', labelEn: 'Urumqi', value: 'Asia/Urumqi' },
  { label: '仰光', labelEn: 'Rangoon', value: 'Asia/Rangoon' },
  { label: '曼谷', labelEn: 'Bangkok', value: 'Asia/Bangkok' },
  { label: '霍巴特', labelEn: 'Hobart', value: 'Australia/Hobart' },
  { label: '胡志明市', labelEn: 'Saigon', value: 'Asia/Saigon' },
  { label: '金边', labelEn: 'Phnom Penh', value: 'Asia/Phnom_Penh' },
  { label: '克拉斯诺亚尔斯克', labelEn: 'Krasnoyarsk', value: 'Asia/Krasnoyarsk' },
  { label: '雅加达', labelEn: 'Jakarta', value: 'Asia/Jakarta' },
  { label: '北京', labelEn: 'Beijing', value: 'Asia/Shanghai' },
  { label: '香港', labelEn: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '新加坡', labelEn: 'Singapore', value: 'Asia/Singapore' },
  { label: '台北', labelEn: 'Taipei', value: 'Asia/Taipei' },
  { label: '吉隆坡', labelEn: 'Kuala Lumpur', value: 'Asia/Kuala_Lumpur' },
  { label: '珀斯', labelEn: 'Perth', value: 'Australia/Perth' },
  { label: '马尼拉', labelEn: 'Manila', value: 'Asia/Manila' },
  { label: '澳门', labelEn: 'Macau', value: 'Asia/Macau' },
  { label: '乌兰巴托', labelEn: 'Ulaanbaatar', value: 'Asia/Ulaanbaatar' },
  { label: '伊尔库茨克', labelEn: 'Irkutsk', value: 'Asia/Irkutsk' },
  { label: '东京', labelEn: 'Tokyo', value: 'Asia/Tokyo' },
  { label: '首尔', labelEn: 'Seoul', value: 'Asia/Seoul' },
  { label: '平壤', labelEn: 'Pyongyang', value: 'Asia/Pyongyang' },
  { label: '雅库茨克', labelEn: 'Yakutsk', value: 'Asia/Yakutsk' },
  { label: '赤塔', labelEn: 'Chita', value: 'Asia/Chita' },
  { label: '阿德莱德', labelEn: 'Adelaide', value: 'Australia/Adelaide' },
  { label: '达尔文', labelEn: 'Darwin', value: 'Australia/Darwin' },
  { label: '布里斯班', labelEn: 'Brisbane', value: 'Australia/Brisbane' },
  { label: '关岛', labelEn: 'Guam', value: 'Pacific/Guam' },
  { label: '海参崴', labelEn: 'Vladivostok', value: 'Asia/Vladivostok' },
  { label: '墨尔本', labelEn: 'Melbourne', value: 'Australia/Melbourne' },
  { label: '悉尼', labelEn: 'Sydney', value: 'Australia/Sydney' },
  { label: '堪培拉', labelEn: 'Canberra', value: 'Australia/Canberra' },
  { label: '豪勋爵岛', labelEn: 'Lord Howe', value: 'Australia/Lord_Howe' },
  { label: '马加丹', labelEn: 'Magadan', value: 'Asia/Magadan' },
  { label: '努美阿', labelEn: 'Noumea', value: 'Pacific/Noumea' },
  { label: '萨哈林', labelEn: 'Sakhalin', value: 'Asia/Sakhalin' },
  { label: '索戈比', labelEn: 'Srednekolymsk', value: 'Asia/Srednekolymsk' },
  { label: '斐济', labelEn: 'Fiji', value: 'Pacific/Fiji' },
  { label: '堪察加', labelEn: 'Kamchatka', value: 'Asia/Kamchatka' },
  { label: '阿纳德尔', labelEn: 'Anadyr', value: 'Asia/Anadyr' },
  { label: '奥克兰', labelEn: 'Auckland', value: 'Pacific/Auckland' },
  { label: '塔拉瓦', labelEn: 'Tarawa', value: 'Pacific/Tarawa' },
  { label: '瑙鲁', labelEn: 'Nauru', value: 'Pacific/Nauru' },
  { label: '富纳富提', labelEn: 'Funafuti', value: 'Pacific/Funafuti' },
  { label: '查塔姆', labelEn: 'Chatham', value: 'Pacific/Chatham' },
  { label: '阿皮亚', labelEn: 'Apia', value: 'Pacific/Apia' },
  { label: '东加塔布', labelEn: 'Tongatapu', value: 'Pacific/Tongatapu' },
  { label: '法考福', labelEn: 'Fakaofo', value: 'Pacific/Fakaofo' },
  { label: '基里地马地岛', labelEn: 'Kiritimati', value: 'Pacific/Kiritimati' },
];

// 时区缩写/别名映射（value -> 别名列表），用于展示和搜索
const TZ_ALIASES = {
  'Pacific/Honolulu': ['HST'],
  'America/Los_Angeles': ['PST', 'PDT'],
  'America/Denver': ['MST', 'MDT'],
  'America/Chicago': ['CST', 'CDT'],
  'America/New_York': ['EST', 'EDT'],
  'America/Sao_Paulo': ['BRT', 'BRST'],
  'UTC': ['UTC', 'GMT'],
  'Europe/London': ['GMT', 'BST'],
  'Europe/Paris': ['CET', 'CEST'],
  'Africa/Cairo': ['EET', 'EEST'],
  'Europe/Moscow': ['MSK'],
  'Asia/Dubai': ['GST'],
  'Asia/Karachi': ['PKT'],
  'Asia/Kolkata': ['IST'],
  'Asia/Dhaka': ['BST'],
  'Asia/Bangkok': ['ICT'],
  'Asia/Shanghai': ['CST', 'CST-China'],
  'Asia/Hong_Kong': ['HKT'],
  'Asia/Taipei': ['TST'],
  'Asia/Tokyo': ['JST'],
  'Asia/Seoul': ['KST'],
  'Asia/Singapore': ['SGT'],
  'Australia/Sydney': ['AEST', 'AEDT'],
  'Australia/Perth': ['AWST'],
  'Australia/Adelaide': ['ACST', 'ACDT'],
  'Australia/Brisbane': ['AEST'],
  'Australia/Melbourne': ['AEST', 'AEDT'],
  'Australia/Canberra': ['AEST', 'AEDT'],
  'Pacific/Auckland': ['NZST', 'NZDT'],
  'Pacific/Honolulu': ['HST'],
  'America/Anchorage': ['AKST', 'AKDT'],
  'America/Phoenix': ['MST'],
  'America/Tijuana': ['PST', 'PDT'],
  'America/Vancouver': ['PST', 'PDT'],
  'America/Nome': ['AKST', 'AKDT'],
  'America/Adak': ['HAST', 'HADT'],
  'Asia/Kuala_Lumpur': ['MYT'],
  'Asia/Manila': ['PHT'],
  'Asia/Jakarta': ['WIB'],
  'Asia/Ho_Chi_Minh': ['ICT'],
  'Asia/Katmandu': ['NPT'],
  'Asia/Colombo': ['IST'],
  'Asia/Tehran': ['IRST', 'IRDT'],
  'Asia/Yerevan': ['AMT'],
  'Asia/Tbilisi': ['GET'],
  'Asia/Baku': ['AZT'],
  'Europe/Berlin': ['CET', 'CEST'],
  'Europe/Madrid': ['CET', 'CEST'],
  'Europe/Rome': ['CET', 'CEST'],
  'Europe/Vienna': ['CET', 'CEST'],
  'Europe/Zurich': ['CET', 'CEST'],
  'Europe/Amsterdam': ['CET', 'CEST'],
  'Europe/Brussels': ['CET', 'CEST'],
  'Europe/Budapest': ['CET', 'CEST'],
  'Europe/Prague': ['CET', 'CEST'],
  'Europe/Warsaw': ['CET', 'CEST'],
  'Europe/Stockholm': ['CET', 'CEST'],
  'Europe/Athens': ['EET', 'EEST'],
  'Europe/Helsinki': ['EET', 'EEST'],
  'Europe/Istanbul': ['TRT'],
  'Europe/Kiev': ['EET', 'EEST'],
  'America/Mexico_City': ['CST', 'CDT'],
  'America/Bogota': ['COT'],
  'America/Lima': ['PET'],
  'America/Manaus': ['AMT'],
  'America/Santiago': ['CLT', 'CLST'],
  'Africa/Lagos': ['WAT'],
  'Africa/Nairobi': ['EAT'],
  'Africa/Johannesburg': ['SAST'],
};

// 便捷：从别名查找对应时区
function zonesByAlias(alias) {
  const u = alias.toUpperCase();
  return getAllZones().filter(z => zoneAliases(z).includes(u));
}
function zoneAliases(z) {
  const builtin = TZ_ALIASES[z.value] || [];
  const custom = Array.isArray(z.abbr) ? z.abbr : (z.abbr ? [String(z.abbr)] : []);
  return [...custom, ...builtin];
}

let TIMEZONES = loadTzConfig();
let tzInitApplied = false;

const SYS_DEFAULTS = { defaultTab: 'sec', precision: 'ns', theme: 'auto', usNsMode: 'derive' };
let SYS_SETTINGS = loadSysSettings();
function loadSysSettings() {
  let s = null;
  try {
    const raw = localStorage.getItem('sys_settings');
    if (raw) s = JSON.parse(raw) || {};
  } catch (e) {}
  if (typeof s !== 'object' || s === null) s = {};
  if (s.precision == null) {
    s.precision = s.showNs ? 'ns' : s.showUs ? 'us' : s.showMs ? 'ms' : 'sec';
  }
  delete s.showMs; delete s.showUs; delete s.showNs;
  s = { ...SYS_DEFAULTS, ...s };
  if (!['sec', 'ms', 'us', 'ns'].includes(s.defaultTab)) s.defaultTab = SYS_DEFAULTS.defaultTab;
  if (!['sec', 'ms', 'us', 'ns'].includes(s.precision)) s.precision = SYS_DEFAULTS.precision;
  if (!['auto', 'dark', 'light'].includes(s.theme)) s.theme = SYS_DEFAULTS.theme;
  if (!['derive', 'random'].includes(s.usNsMode)) s.usNsMode = SYS_DEFAULTS.usNsMode;
  return s;
}
const PRECISION_ORDER = { sec: 0, ms: 1, us: 2, ns: 3 };
function precisionGe(level) {
  return (PRECISION_ORDER[SYS_SETTINGS.precision] || 0) >= PRECISION_ORDER[level];
}
function applyTheme() {
  let light = SYS_SETTINGS.theme === 'light';
  if (SYS_SETTINGS.theme === 'auto' && window.matchMedia) {
    light = window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  document.body.classList.toggle('theme-light', light);
  document.body.classList.toggle('theme-dark', !light);
}
function initThemeWatcher() {
  if (!window.matchMedia || typeof window.matchMedia !== 'function') return;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    if (SYS_SETTINGS.theme === 'auto') applyTheme();
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}
function saveSysSettings() {
  try { localStorage.setItem('sys_settings', JSON.stringify(SYS_SETTINGS)); } catch (e) {}
}

const I18N = {
  zh: {
    secTab: '秒级', msTab: '毫秒级', usTab: '微秒级', nsTab: '纳秒级',
    tzLabel: '时区', toggleEn: 'EN',
    dateToTs: '日期 → 时间戳', tsToDate: '时间戳 → 日期',
    tsOutput: '时间戳', dateOutput: '日期',
    convert: '转换', copy: '复制', copied: '已复制',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: 'ms',
    fracPlaceholderMs: '毫秒', fracPlaceholderUs: '微秒', fracPlaceholderNs: '纳秒',
    tsPlaceholderSec: '请输入秒级时间戳',
    tsPlaceholderMs: '请输入毫秒级时间戳',
    tsPlaceholderUs: '请输入微秒级时间戳',
    tsPlaceholderNs: '请输入纳秒级时间戳',
    currentTime: '当前时间', pause: '暂停', resume: '继续',
    localTime: '本地时间', secTs: '秒级时间戳', msTs: '毫秒级时间戳', usTs: '微秒级时间戳', nsTs: '纳秒级时间戳',
    copiedMsg: '已复制到剪贴板', tsUnitSec: '秒', tsUnitMs: '毫秒', tsUnitUs: '微秒', tsUnitNs: '纳秒', customTag: '自定义',
    invalidYear: '无效年份', outOfTsRange: '超出时间戳范围',
    clipboardFail: '无法读取剪贴板内容（浏览器权限受限），请手动粘贴',
    tzConfigTitle: '配置时区', calendarTitle: '打开日历', clearTitle: '清空',
    calPrevTitle: '上一年', calNextTitle: '下一年', calTitleToggle: '点击切换 年月',
    tzWheelTitle: '双滚轮时区选择器：滚轮切换小时/分钟，点击⟲重置为全局时区',
    tzHourWheelTitle: '小时滚轮：滚轮切换时区偏移小时',
    tzMinWheelTitle: '分钟滚轮：滚轮切换时区偏移分钟',
    tzResetTitle: '重置为全局时区',
    outOfRange: '超出可表示范围',
    hintClick: '输入即转换 · 点击结果复制',
    invalidDate: '日期格式无效',
    invalidTs: '时间戳格式无效',
    ok: '确定', now: '此刻',
    today: '今天', yesterday: '昨天', tomorrow: '明天', dayAfter: '后天',
    useDate: '使用该日期', quick: '快捷',
    timezoneConfig: '时区配置', defaultTimezones: '默认时区列表',
    tzConfigDesc: '勾选要在时区下拉框中显示的时区',
    dateFormatDesc: '勾选要在悬停列表显示的格式，支持添加自定义格式',
    builtinFormats: '内置格式',
    builtinFormatsDesc: '勾选要显示在悬停列表中的格式。占位符：YYYY年 MM月 DD日 HH 24小时・hh 12小时 mm分 ss秒 SSS毫秒 A AM・PM W 星期',
    customFormats: '自定义格式', resetFormats: '重置格式', noCustomFmt: '暂无自定义格式',
    customFormatsPlaceholder: '自定义格式，如 YYYY年MM月DD日 HH:mm:ss',
    save: '保存配置', reset: '重置默认',
    tzSearchPlaceholder: '搜索时区名称...',
    filterAll: '全部', filterSelected: '已选中', filterUnselected: '未选中',
    customTimezones: '自定义时区',
    customTzDesc: '添加自定义时区：填真实时区（如 America/New_York）将自动跟随夏令时；不填则用固定偏移',
    add: '添加', noCustomTz: '暂无自定义时区',
    configTitle: '配置', tabTimezone: '时区配置', tabDateFormat: '日期格式',
    tabDateParse: '日期解析',
    dateParseDesc: '勾选要启用的日期解析格式；无关键词进入时自动识别剪贴板日期',
    resetParse: '重置解析',
    dateParseSearchPlaceholder: '搜索格式...',
    monthDayStyle: '月/日 歧义风格',
    monthDayStyleDesc: '07/09/2026 这类月/日顺序歧义按所选风格解释，并自动套用到今年（如 09-07）',
    styleUs: '美式 MM/DD', styleEu: '欧式 DD/MM',
    noMatch: '无匹配',
    customParse: '自定义解析规则方法',
    customParseDesc: '添加自定义规则来自动识别非标准格式。占位符用 YYYY YY MM DD HH hh mm ss SSS；正则需要具名捕获组 y/mo/d/h/mi/s/ms（至少 y/mo/d）。自定义规则优先于内置格式解析。',
    customParsePlaceholder: '占位符格式，如 YYYY年M月D日 H时m分',
    customParseRegex: '正则，如 ^(?<y>\\d{4})/(?<mo>\\d{1,2})/(?<d>\\d{1,2})$',
    customParseAdd: '添加',
    noCustomParse: '暂无自定义规则',
    customParseType: '类型：',
    customParseTypePlaceholder: '占位符',
    customParseTypeRegex: '正则',
    tabSystem: '系统设置',
    sysConfigDesc: '设置默认TAB页、精度显示、微秒/纳秒显示方式与主题',
    sysDefaultTab: '默认进入TAB页',
    sysDefaultTabDesc: '选择插件打开时默认进入的TAB页',
    sysShowPrecision: '精度显示',
    sysShowPrecisionDesc: '精度层层递进：选中纳秒显示毫秒+微秒+纳秒，选中微秒显示毫秒+微秒，选中毫秒仅显示毫秒，选中秒级则只显示时分秒',
    sysTheme: '主题',
    sysThemeDesc: '自动跟随系统外观，或固定使用黑夜/白天主题',
    sysThemeAuto: '自动',
    sysThemeDark: '黑夜',
    sysThemeLight: '白天',
    sysReset: '已恢复默认系统设置',
    sysUsNs: '微秒/纳秒显示方式',
    sysUsNsDesc: '「推算一致」由当前毫秒推导并与毫秒显示同步；「随机」每秒后 6/9 位随机（两者与实际精度相差均在毫秒之下）',
    sysUsNsDerive: '与毫秒推算一致',
    sysUsNsRandom: '随机',
    donate: '支持开发者',
    donateTitle: '支持开发者',
    donateDesc: '如果这个工具帮到了你，可以请我喝杯咖啡 ☕',
    donateThanks: '感谢你的支持',
  },
en: {
    secTab: 'Seconds', msTab: 'Milliseconds', usTab: 'Microseconds', nsTab: 'Nanoseconds',
    tzLabel: 'Timezone', toggleEn: '中',
    dateToTs: 'Date → Timestamp', tsToDate: 'Timestamp → Date',
    tsOutput: 'Timestamp', dateOutput: 'Date',
    convert: 'Convert', copy: 'Copy', copied: 'Copied',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: 'ms',
    fracPlaceholderMs: 'ms', fracPlaceholderUs: 'us', fracPlaceholderNs: 'ns',
    tsPlaceholderSec: 'Enter seconds timestamp (10 digits)',
    tsPlaceholderMs: 'Enter ms timestamp (13 digits)',
    tsPlaceholderUs: 'Enter microseconds timestamp (16 digits)',
    tsPlaceholderNs: 'Enter nanoseconds timestamp (19 digits)',
    currentTime: 'Current Time', pause: 'Pause', resume: 'Resume',
    localTime: 'Local Time', secTs: 'Seconds TS', msTs: 'Milliseconds TS', usTs: 'Microseconds TS', nsTs: 'Nanoseconds TS',
    copiedMsg: 'Copied to clipboard', tsUnitSec: 'sec', tsUnitMs: 'ms', tsUnitUs: 'μs', tsUnitNs: 'ns', customTag: 'Custom',
    invalidYear: 'Invalid date', outOfTsRange: 'Out of supported timestamp range',
    clipboardFail: 'Cannot read clipboard (browser permission restricted), paste manually',
    tzConfigTitle: 'Timezone settings', calendarTitle: 'Open calendar', clearTitle: 'Clear',
    calPrevTitle: 'Previous year', calNextTitle: 'Next year', calTitleToggle: 'Click to switch year/month',
    tzWheelTitle: 'Wheel timezone picker: scroll hour/minute, click ⟲ to reset',
    tzHourWheelTitle: 'Hour wheel: scroll to change hour offset',
    tzMinWheelTitle: 'Minute wheel: scroll to change minute offset',
    tzResetTitle: 'Reset to global timezone',
    outOfRange: 'Out of representable range',
    hintClick: 'Type to convert · Click result to copy',
    invalidDate: 'Invalid date format',
    invalidTs: 'Invalid timestamp format',
    ok: 'OK', now: 'Now',
    today: 'Today', yesterday: 'Yesterday', tomorrow: 'Tomorrow', dayAfter: 'Day after',
    useDate: 'Use this date', quick: 'Quick',
    timezoneConfig: 'Timezone Config', defaultTimezones: 'Default Timezone List',
    tzConfigDesc: 'Choose timezones to show in the dropdown',
    dateFormatDesc: 'Choose formats for the hover list; custom formats supported',
    builtinFormats: 'Built-in Formats',
    builtinFormatsDesc: 'Check formats to show in the hover list. Tokens: YYYY年 MM月 DD日 HH 24h・hh 12h mm分 ss秒 SSS A AM・PM W weekday',
    customFormats: 'Custom Formats', resetFormats: 'Reset Formats', noCustomFmt: 'No custom formats yet',
    customFormatsPlaceholder: 'Custom format, e.g. YYYY年MM月DD日 HH:mm:ss',
    save: 'Save', reset: 'Reset',
    tzSearchPlaceholder: 'Search timezones...',
    filterAll: 'All', filterSelected: 'Selected', filterUnselected: 'Unselected',
    customTimezones: 'Custom Timezones',
    customTzDesc: 'Add custom timezones: enter a real timezone (e.g. America/New_York) to follow DST automatically, or use a fixed offset',
    add: 'Add', noCustomTz: 'No custom timezones yet',
    configTitle: 'Settings', tabTimezone: 'Timezones', tabDateFormat: 'Date Formats',
    tabDateParse: 'Date Parsing',
    dateParseDesc: 'Enable date parse formats; clipboard dates auto-detected on entry',
    resetParse: 'Reset Parsing',
    dateParseSearchPlaceholder: 'Search formats...',
    monthDayStyle: 'Month/Day Style',
    monthDayStyleDesc: 'Ambiguous month/day order like 07/09/2026 follows the selected style; also applied to yearless forms (e.g. 09-07)',
    styleUs: 'US MM/DD', styleEu: 'EU DD/MM',
    noMatch: 'No match',
    customParse: 'Custom parse rules',
    customParseDesc: 'Add custom rules to recognize non-standard formats. Placeholder tokens: YYYY YY MM DD HH hh mm ss SSS; regex must use named groups y/mo/d/h/mi/s/ms (at least y/mo/d). Custom rules are tried before built-in formats.',
    customParsePlaceholder: 'Placeholder format, e.g. YYYY年M月D日 H时m分',
    customParseRegex: 'Regex, e.g. ^(?<y>\\d{4})/(?<mo>\\d{1,2})/(?<d>\\d{1,2})$',
    customParseAdd: 'Add',
    noCustomParse: 'No custom rules yet',
    customParseType: 'Type:',
    customParseTypePlaceholder: 'Placeholder',
    customParseTypeRegex: 'Regex',
    tabSystem: 'System',
    sysConfigDesc: 'Default tab, precision visibility, micro/nano display and theme',
    sysDefaultTab: 'Default Tab',
    sysDefaultTabDesc: 'Choose the tab shown when the plugin opens',
    sysShowPrecision: 'Precision Visibility',
    sysShowPrecisionDesc: 'Progressive precision: choosing Nanoseconds shows ms+us+ns, Microseconds shows ms+us, Milliseconds shows only ms, Seconds only shows HH:mm:ss',
    sysTheme: 'Theme',
    sysThemeDesc: 'Follow the system preference, or force Night / Day theme',
    sysThemeAuto: 'Auto',
    sysThemeDark: 'Night',
    sysThemeLight: 'Day',
    sysReset: 'Reset to default system settings',
    sysUsNs: 'Microsecond/Nanosecond display',
    sysUsNsDesc: '"Derived" computes from the current millisecond and stays in sync; "Random" fills the sub-millisecond digits randomly (both are below real precision anyway)',
    sysUsNsDerive: 'Derived from ms',
    sysUsNsRandom: 'Random',
    donate: 'Support Developer',
    donateTitle: 'Support Developer',
    donateDesc: 'If this tool has helped you, you can buy me a coffee ☕',
    donateThanks: 'Thank you for your support',
  },
};

let lang = 'zh';
const BUILD = 'v1.0.0';
let currentTab = 'sec';
let inputTzCustom = false;
let paused = false;
let lastNow = new Date();
let lastSec = 0;
let lastMs = 0;
let lastUpdateTime = 0;

const timezoneEl = $('#timezone');
const inputTzEl = $('#input-tz');
const toastEl = $('#toast');
const nowDateEl = $('#now-date');
const nowSecEl = $('#now-sec');
const nowMsEl = $('#now-ms');
const nowUsEl = $('#now-us');
const nowNsEl = $('#now-ns');
const liveDot = $('#live-dot');
const btnPause = $('#btn-pause');
const dateInput = $('#date-input');
const timeInputEl = $('#time-input');
const fracInputEl = $('#frac-input');
const tsInput = $('#ts-input');

// 强制设置时间戳输入框背景色，与日期输入框保持一致
tsInput.style.backgroundColor = 'var(--panel)';
// 设置圆滑的边框
tsInput.style.borderRadius = '12px';
const d2tVal = $('#d2t-val');
const t2dVal = $('#t2d-val');
const t2dResultEl = $('#t2d-result');
const t2dPopoverEl = $('#t2d-popover');
const hintD2t = $('#d2t-hint');
const hintT2d = $('#t2d-hint');
const btnDateClear = $('#btn-date-clear');
const btnTsClear = $('#btn-ts-clear');
const btnLang = $('#btn-lang');
const calendarEl = $('#calendar');
const calGrid = $('#cal-grid');
const calRightEl = document.querySelector('#calendar .cal-right');
const calTitle = $('#cal-title');
const calHeadEl = document.querySelector('#calendar .cal-head');
const wheelHh = $('#wheel-hh');
const wheelMm = $('#wheel-mm');
const wheelSs = $('#wheel-ss');
const wheelMs = $('#wheel-ms');
const wheelUs = $('#wheel-us');
const wheelNs = $('#wheel-ns');
const calTimeInputEl = $('#cal-time-input');
const dateSuggestEl = $('#date-suggest');
const dateFieldEl = $('#date-field');

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;
let calView = 'day';
let calDecadeStart = Math.floor(new Date().getFullYear() / 10) * 10;
let calTime = { hh: 0, mm: 0, ss: 0, ms: 0, us: 0, ns: 0 };
let skipViewSync = false;
let skipTimeSync = false;

const calMonthsEl = $('#cal-months');
const calYearsEl = $('#cal-years');
const calYearHeadEl = $('#cal-year-head');
const calBodyDay = $('#cal-body-day');
const calBodyMonth = $('#cal-body-month');
const calBodyYear = $('#cal-body-year');
const calYearInputEl = $('#cal-year-input');

const pad = (n) => String(n).padStart(2, '0');

function lookupZone(value) {
  return ALL_TIMEZONES.find(z => z.value === value) || CUSTOM_TIMEZONES.find(z => z.value === value);
}

function guessLocalTzName() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
}

function withLocalZone(list) {
  const local = guessLocalTzName();
  if (!local || list.some(z => z.value === local)) return list;
  const z = lookupZone(local) || { label: local, labelEn: local, value: local };
  return [z, ...list];
}

function loadTzConfig() {
  const saved = localStorage.getItem('tz_selected');
  if (saved) {
    try {
      const ids = JSON.parse(saved);
      const list = ids.map(id => lookupZone(id) || { label: id, labelEn: id, value: id })
        .filter(z => z && (z.label || z.labelEn));
      if (list.length > 0) return withLocalZone(list);
    } catch (e) {}
  }
  return withLocalZone([...DEFAULT_TZ_LIST]);
}

function saveTzConfig(selectedValues) {
  localStorage.setItem('tz_selected', JSON.stringify(selectedValues));
}

function commitTzConfig() {
  const selected = DEFAULT_TZ_LIST.map(z => z.value).filter(v => tzConfigSelected.has(v)).concat(
    getAllZones().filter(z => tzConfigSelected.has(z.value) && !DEFAULT_TZ_LIST.some(d => d.value === z.value)).map(z => z.value)
  );
  tzConfigSelected.forEach(v => { if (!selected.includes(v)) selected.push(v); });
  saveTzConfig(selected);
  TIMEZONES = withLocalZone(selected.map(v =>
    lookupZone(v) || { label: v, labelEn: v, value: v }
  ));
  applyLang();
}

function resetTzConfig() {
  localStorage.removeItem('tz_selected');
  TIMEZONES = withLocalZone([...DEFAULT_TZ_LIST]);
  tzConfigSelected = new Set(DEFAULT_TZ_LIST.map(z => z.value));
  renderTzConfigList();
  applyLang();
}

const tzConfigModal = $('#tz-config-modal');
const tzConfigListEl = $('#timezone-list');
const tzSearchEl = $('#tz-search');
const tzFilterEl = $('#tz-filter');
const btnResetTzConfig = $('#reset-tz-config');
const btnTzConfig = $('#tz-config-btn');
const modalCloseEl = $('#modal-close');
const dateParseSearchEl = $('#date-parse-search');
const btnCustomFmtAdd = $('#custom-fmt-add');
const btnResetFmtConfig = $('#reset-fmt-config');
const customTzCnEl = $('#custom-tz-cn');
const customTzEnEl = $('#custom-tz-en');
const customTzOffsetEl = $('#custom-tz-offset');
const customTzAbbrEl = $('#custom-tz-abbr');
const customTzIanaEl = $('#custom-tz-iana');
const customTzListEl = $('#custom-tz-list');
const btnCustomTzAdd = $('#custom-tz-add');
let tzConfigSelected = new Set(TIMEZONES.filter(z => z.value !== '').map(z => z.value));

function loadCustomTimezones() {
  try {
    const raw = localStorage.getItem('tz_custom');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter(t => t && t.value && (t.label || t.labelEn)).map(t => ({ ...t, custom: true }));
      }
    }
  } catch (e) {}
  return [];
}
let CUSTOM_TIMEZONES = loadCustomTimezones();
let tzEditingValue = null;

function getAllZones() {
  return [...ALL_TIMEZONES, ...CUSTOM_TIMEZONES];
}

function renderTzConfigList() {
  if (!tzConfigListEl) return;
  const query = tzSearchEl ? tzSearchEl.value.trim().toLowerCase() : '';
  const activeBtn = tzFilterEl ? tzFilterEl.querySelector('.tz-filter-btn.active') : null;
  const filter = activeBtn ? activeBtn.dataset.value : 'all';
  const list = getAllZones().filter(z => {
    if (filter === 'selected' && !tzConfigSelected.has(z.value)) return false;
    if (filter === 'unselected' && tzConfigSelected.has(z.value)) return false;
    if (!query) return true;
    if (z.label.toLowerCase().includes(query)) return true;
    if (z.labelEn.toLowerCase().includes(query)) return true;
    if (z.value.toLowerCase().includes(query)) return true;
    if (z.iana && z.iana.toLowerCase().includes(query)) return true;
    if (zoneAliases(z).some(a => a.toLowerCase().includes(query))) return true;
    if (zoneAliases(z).some(a => a.toLowerCase() === query)) return true;
    const offset = offsetMinutes(new Date(), z.value);
    const offsetHour = Math.floor(Math.abs(offset) / 60);
    const offsetMinute = Math.abs(offset) % 60;
    const hourPadded = String(offsetHour).padStart(2, '0');
    const offsetVariants = [
      `${offset >= 0 ? '+' : '-'}${offsetHour}`,          // +8 / -5
      `${offset >= 0 ? '+' : '-'}${hourPadded}`,          // +08
      `${Math.abs(offset)}`,                              // 8 / 330 / 830
      formatOffset(offset),                               // UTC+8 / UTC+08:00
    ];
    if (offsetMinute > 0) {
      offsetVariants.push(`${offset >= 0 ? '+' : '-'}${hourPadded}:${String(offsetMinute).padStart(2, '0')}`); // +05:30
      offsetVariants.push(`${offset >= 0 ? '+' : '-'}${offsetHour}${offsetMinute}`); // +530
      offsetVariants.push(`${hourPadded}${String(offsetMinute).padStart(2, '0')}`); // 0530
    }
    return offsetVariants.some(v => v.toLowerCase().includes(query));
  });
  tzConfigListEl.innerHTML = list.map((z, idx) => {
    const offset = offsetMinutes ? offsetMinutes(new Date(), z.value) : 0;
    const offsetStr = formatOffset ? formatOffset(offset) : '';
    const selected = tzConfigSelected.has(z.value);
    const label = htmlEscape(lang === 'zh' ? z.label : z.labelEn);
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).map(a => htmlEscape(a)).join('/')}</span>` : '';
    const valueAttr = escapeAttr(z.value);
    return `<div class="timezone-item ${selected ? 'selected' : ''}" data-value="${valueAttr}">
      <div class="timezone-info">
        <div class="timezone-name">${label} ${aliasStr}</div>
        <div class="timezone-offset">${offsetStr} · <span class="timezone-value">${htmlEscape(z.value)}</span></div>
      </div>
      <span class="tz-check">${selected ? '✓' : ''}</span>
    </div>`;
  }).join('');
  if (tzConfigListEl) {
    tzConfigListEl.querySelectorAll('.timezone-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.value;
        if (tzConfigSelected.has(val)) {
          tzConfigSelected.delete(val);
          item.classList.remove('selected');
        } else {
          tzConfigSelected.add(val);
          item.classList.add('selected');
        }
        item.querySelector('.tz-check').textContent = tzConfigSelected.has(val) ? '✓' : '';
        commitTzConfig();
      });
    });
  }
  renderCustomTzList();
}

function parseOffsetInput(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  // +8 / -5 / 8 / +08:00 / -04:30 / 0530 / +530 / 330
  let m = s.match(/^([+-])?(\d{1,2})(?::(\d{2}))?$/) || s.match(/^([+-])?(\d{2})?(\d{2})$/.exec(s) && s.match(/^([+-])?(\d{1,2})(\d{2})$/));
  let sign, hh, mm;
  if (m) {
    sign = m[1] === '-' ? -1 : 1;
    hh = parseInt(m[2], 10);
    mm = m[3] ? parseInt(m[3], 10) : 0;
  } else {
    const m2 = s.match(/^([+-])?(\d{1,2})(\d{2})$/);
    if (m2) { sign = m2[1] === '-' ? -1 : 1; hh = parseInt(m2[2], 10); mm = parseInt(m2[3], 10); }
  }
  if (typeof hh === 'undefined') return null;
  if (mm === undefined) mm = 0;
  if (mm >= 60) return null;
  const total = hh * 60 + mm;
  if (total > 14 * 60 || total < -12 * 60) return null;
  return total * sign;
}

function isValidIana(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch (e) { return false; }
}

function addCustomTimezone() {
  const cn = customTzCnEl ? customTzCnEl.value.trim() : '';
  const en = customTzEnEl ? customTzEnEl.value.trim() : '';
  const offsetStr = customTzOffsetEl ? customTzOffsetEl.value.trim() : '';
  const abbrStr = customTzAbbrEl ? customTzAbbrEl.value.trim() : '';
  const iana = customTzIanaEl ? customTzIanaEl.value.trim() : '';
  if (!cn && !en) { toast(lang === 'zh' ? '请输入中文名或英文名' : 'Enter a Chinese or English name'); return; }

  let value;
  let fallbackLabel;
  if (iana) {
    if (!isValidIana(iana)) { toast(lang === 'zh' ? 'IANA时区无效，请检查拼写（如 Asia/Shanghai）' : 'Invalid IANA timezone, check spelling (e.g. Asia/Shanghai)'); return; }
    value = iana;
    fallbackLabel = iana;
  } else {
    const mins = parseOffsetInput(offsetStr);
    if (mins === null) { toast(lang === 'zh' ? '未填写IANA时，请输入 -12 到 +14 之间的有效偏移' : 'Enter a valid offset between -12 and +14 when no IANA timezone is set'); return; }
    const sign = mins >= 0 ? '+' : '-';
    const a = Math.abs(mins);
    value = `FIXED:${sign}${String(Math.floor(a / 60)).padStart(2, '0')}${String(a % 60).padStart(2, '0')}`;
    fallbackLabel = formatOffset(mins);
  }
  if (ALL_TIMEZONES.some(z => z.value === value) || CUSTOM_TIMEZONES.some(z => z.value === value)) {
    toast(lang === 'zh' ? '该时区已存在' : 'This timezone already exists');
    return;
  }
  const abbr = abbrStr ? abbrStr.split(/[\/\s,，]+/).map(x => x.trim()).filter(Boolean) : [];
  const zone = { label: cn || `自定义 ${fallbackLabel}`, labelEn: en || `Custom ${fallbackLabel}`, value, custom: true, abbr, iana };
  CUSTOM_TIMEZONES.push(zone);
  persistCustomTimezones();
  tzConfigSelected.add(value);
  if (customTzCnEl) customTzCnEl.value = '';
  if (customTzEnEl) customTzEnEl.value = '';
  if (customTzOffsetEl) customTzOffsetEl.value = '';
  if (customTzAbbrEl) customTzAbbrEl.value = '';
  if (customTzIanaEl) customTzIanaEl.value = '';
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
  toast(lang === 'zh' ? '自定义时区已添加' : 'Custom timezone added');
}

function persistCustomTimezones() {
  localStorage.setItem('tz_custom', JSON.stringify(CUSTOM_TIMEZONES.map(z => ({ label: z.label, labelEn: z.labelEn, value: z.value, abbr: z.abbr || [], iana: z.iana || '' }))));
}

function removeCustomTimezone(value) {
  CUSTOM_TIMEZONES = CUSTOM_TIMEZONES.filter(z => z.value !== value);
  persistCustomTimezones();
  tzConfigSelected.delete(value);
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
}

function offsetInputFromValue(value) {
  const m = String(value || '').match(/^FIXED:([+-])(\d{2})(\d{2})$/);
  if (!m) return '';
  return `${m[1]}${m[2]}:${m[3]}`;
}

function renderCustomTzList() {
  if (!customTzListEl) return;
  if (CUSTOM_TIMEZONES.length === 0) {
    customTzListEl.innerHTML = `<div class="empty-tip" data-i18n="noCustomTz">暂无自定义时区</div>`;
    applyModalI18n();
    return;
  }
  customTzListEl.innerHTML = CUSTOM_TIMEZONES.map(z => {
    if (tzEditingValue === z.value) {
      const aliasVal = (Array.isArray(z.abbr) ? z.abbr : [z.abbr]).filter(Boolean).join('/');
      return `<div class="custom-tz-item editing" data-value="${z.value}">
        <div class="custom-tz-edit-form">
          <div class="custom-tz-form-row">
            <input type="text" class="edit-cn" value="${escapeAttr(z.label)}" placeholder="中文名">
            <input type="text" class="edit-en" value="${escapeAttr(z.labelEn)}" placeholder="English">
            <input type="text" class="edit-offset" value="${escapeAttr(offsetInputFromValue(z.value))}" placeholder="偏移（如 +08:00）">
          </div>
          <div class="custom-tz-form-row optional-row">
            <input type="text" class="edit-abbr" value="${escapeAttr(aliasVal)}" placeholder="别名（可选）">
            <input type="text" class="edit-iana" value="${escapeAttr(z.iana || '')}" placeholder="真实时区（可选，自动跟随夏令时）">
            <button class="custom-tz-save">${lang === 'zh' ? '保存' : 'Save'}</button>
            <button class="custom-tz-cancel">${lang === 'zh' ? '取消' : 'Cancel'}</button>
          </div>
        </div>
      </div>`;
    }
    const label = htmlEscape(lang === 'zh' ? z.label : z.labelEn);
    const offsetStr = formatOffset(offsetMinutes(new Date(), z.value));
    const idStr = z.iana ? `<span class="timezone-value">${htmlEscape(z.iana)}</span>` : `<span class="timezone-value">${htmlEscape(z.value)}</span>`;
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).map(a => htmlEscape(a)).join('/')}</span>` : '';
    return `<div class="custom-tz-item" data-value="${escapeAttr(z.value)}">
      <div class="timezone-info">
        <div class="timezone-name">${label} ${aliasStr}</div>
        <div class="timezone-offset">${offsetStr} · ${idStr}</div>
      </div>
      <div class="custom-tz-actions">
        <button class="custom-tz-edit" title="${lang === 'zh' ? '编辑' : 'Edit'}">✎</button>
        <button class="custom-tz-del" title="${lang === 'zh' ? '删除' : 'Delete'}">✕</button>
      </div>
    </div>`;
  }).join('');
  customTzListEl.querySelectorAll('.custom-tz-item').forEach(item => {
    if (item.classList.contains('editing')) {
      const val = item.dataset.value;
      item.querySelector('.custom-tz-save').addEventListener('click', (e) => {
        e.stopPropagation();
        saveEditCustomTimezone(val, item);
      });
      item.querySelector('.custom-tz-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        tzEditingValue = null;
        renderCustomTzList();
      });
      return;
    }
    item.querySelector('.custom-tz-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      tzEditingValue = item.dataset.value;
      renderCustomTzList();
    });
    item.querySelector('.custom-tz-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCustomTimezone(item.dataset.value);
    });
  });
}

function saveEditCustomTimezone(value, item) {
  const zone = CUSTOM_TIMEZONES.find(z => z.value === value);
  if (!zone) return;
  const cn = (item.querySelector('.edit-cn').value || '').trim();
  const en = (item.querySelector('.edit-en').value || '').trim();
  const offsetStr = (item.querySelector('.edit-offset').value || '').trim();
  const abbrStr = (item.querySelector('.edit-abbr').value || '').trim();
  const iana = (item.querySelector('.edit-iana').value || '').trim();
  if (!cn && !en) { toast(lang === 'zh' ? '请输入中文名或英文名' : 'Enter a Chinese or English name'); return; }

  let newValue, fallbackLabel;
  if (iana) {
    if (!isValidIana(iana)) { toast(lang === 'zh' ? 'IANA时区无效，请检查拼写（如 Asia/Shanghai）' : 'Invalid IANA timezone, check spelling (e.g. Asia/Shanghai)'); return; }
    newValue = iana;
    fallbackLabel = iana;
  } else {
    const mins = parseOffsetInput(offsetStr);
    if (mins === null) { toast(lang === 'zh' ? '未填写IANA时，请输入 -12 到 +14 之间的有效偏移' : 'Enter a valid offset between -12 and +14 when no IANA timezone is set'); return; }
    const sign = mins >= 0 ? '+' : '-';
    const a = Math.abs(mins);
    newValue = `FIXED:${sign}${String(Math.floor(a / 60)).padStart(2, '0')}${String(a % 60).padStart(2, '0')}`;
    fallbackLabel = formatOffset(mins);
  }
  if (newValue !== value && (ALL_TIMEZONES.some(z => z.value === newValue) || CUSTOM_TIMEZONES.some(z => z.value === newValue))) {
    toast(lang === 'zh' ? '该时区已存在' : 'This timezone already exists');
    return;
  }
  const abbr = abbrStr ? abbrStr.split(/[\/\s,，]+/).map(x => x.trim()).filter(Boolean) : [];
  zone.label = cn || `自定义 ${fallbackLabel}`;
  zone.labelEn = en || `Custom ${fallbackLabel}`;
  zone.abbr = abbr;
  zone.iana = iana;
  if (newValue !== value) {
    zone.value = newValue;
    tzConfigSelected.delete(value);
    tzConfigSelected.add(newValue);
  }
  persistCustomTimezones();
  tzEditingValue = null;
  renderCustomTzList();
  renderTzConfigList();
  commitTzConfig();
  toast(lang === 'zh' ? '自定义时区已更新' : 'Custom timezone updated');
}

function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyModalI18n() {
  const emptyTip = customTzListEl && customTzListEl.querySelector('.empty-tip');
  if (emptyTip) emptyTip.textContent = t('noCustomTz');
  renderDateParseList();
  renderCustomParseRules();
  updateParseStyleBtns();
  const dateParseSearch = $('#date-parse-search');
  if (dateParseSearch) dateParseSearch.placeholder = t('dateParseSearchPlaceholder');
}

function initTzConfig() {
  const configTabsEl = $('#config-tabs');
  const configPanes = { tz: $('#pane-tz'), fmt: $('#pane-fmt'), parse: $('#pane-parse'), sys: $('#pane-sys') };
  if (configTabsEl) {
    configTabsEl.querySelectorAll('.config-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        configTabsEl.querySelectorAll('.config-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const name = btn.dataset.tab;
        Object.entries(configPanes).forEach(([k, pane]) => {
          if (pane) pane.classList.toggle('hidden', k !== name);
        });
      });
    });
  }
  if (btnTzConfig) {
    btnTzConfig.addEventListener('click', () => {
      tzConfigModal.classList.add('show');
      renderTzConfigList();
      renderCustomTzList();
      renderDateParseList();
      renderCustomParseRules();
      updateParseStyleBtns();
      renderSysConfig();
    });
  }
  if (modalCloseEl) {
    modalCloseEl.addEventListener('click', () => tzConfigModal.classList.remove('show'));
  }
  tzConfigModal.addEventListener('click', (e) => {
    if (e.target === tzConfigModal) tzConfigModal.classList.remove('show');
  });
  const donateModal = $('#donate-modal');
  const donateLink = $('#donate-link');
  const donateClose = $('#donate-close');
  if (donateLink) {
    donateLink.addEventListener('click', () => {
      if (donateModal) donateModal.classList.add('show');
    });
  }
  if (donateClose) {
    donateClose.addEventListener('click', () => {
      if (donateModal) donateModal.classList.remove('show');
    });
  }
  if (donateModal) {
    donateModal.addEventListener('click', (e) => {
      if (e.target === donateModal) donateModal.classList.remove('show');
    });
  }
  if (btnCustomTzAdd) {
    btnCustomTzAdd.addEventListener('click', () => addCustomTimezone());
    [customTzCnEl, customTzEnEl, customTzOffsetEl].forEach(el => {
      if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTimezone(); });
    });
  }
  if (btnResetTzConfig) {
    btnResetTzConfig.addEventListener('click', () => resetTzConfig());
  }
  if (tzSearchEl) {
    tzSearchEl.addEventListener('input', debounce(() => renderTzConfigList(), 150));
  }
  if (tzFilterEl) {
    tzFilterEl.querySelectorAll('.tz-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tzFilterEl.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTzConfigList();
      });
    });
  }
}

function setFilterValue(id, value) {
  const group = document.getElementById(id);
  if (!group) return;
  group.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.value === value));
}
function getFilterValue(id) {
  const group = document.getElementById(id);
  const active = group && group.querySelector('.tz-filter-btn.active');
  return active ? active.dataset.value : null;
}
function renderSysConfig() {
  setFilterValue('sys-default-tab', SYS_SETTINGS.defaultTab);
  setFilterValue('sys-precision', SYS_SETTINGS.precision);
  setFilterValue('sys-theme', SYS_SETTINGS.theme);
  setFilterValue('sys-usns', SYS_SETTINGS.usNsMode);
}
function applySysField(id, value) {
  if (id === 'sys-default-tab') {
    SYS_SETTINGS.defaultTab = value || SYS_DEFAULTS.defaultTab;
  } else if (id === 'sys-precision') {
    SYS_SETTINGS.precision = value || SYS_DEFAULTS.precision;
  } else if (id === 'sys-theme') {
    SYS_SETTINGS.theme = value || SYS_DEFAULTS.theme;
  } else if (id === 'sys-usns') {
    SYS_SETTINGS.usNsMode = value || SYS_DEFAULTS.usNsMode;
  }
  saveSysSettings();
  if (id === 'sys-precision') {
    switchTab(currentTab);
    updatePrecisionIndicators();
  } else if (id === 'sys-theme') applyTheme();
}
function resetSysConfig() {
  SYS_SETTINGS = { ...SYS_DEFAULTS };
  saveSysSettings();
  renderSysConfig();
  applyTheme();
  switchTab(currentTab);
  updatePrecisionIndicators();
  toast(t('sysReset'));
}
function initSysConfig() {
  const resetBtn = $('#reset-sys-config');
  if (resetBtn) resetBtn.addEventListener('click', resetSysConfig);
  ['sys-default-tab', 'sys-precision', 'sys-theme', 'sys-usns'].forEach(id => {
    const g = document.getElementById(id);
    if (!g) return;
    g.addEventListener('click', (e) => {
      const btn = e.target.closest('.tz-filter-btn');
      if (!btn || btn.classList.contains('active')) return;
      g.querySelectorAll('.tz-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applySysField(id, btn.dataset.value);
    });
  });
}
