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
  { label: '协调世界时', labelEn: 'UTC', value: 'UTC' },
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
  { label: '协调世界时', labelEn: 'UTC', value: 'UTC' },
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

const I18N = {
  zh: {
    secTab: '秒级', msTab: '毫秒级',
    tzLabel: '时区', toggleEn: 'EN',
    dateToTs: '日期 → 时间戳', tsToDate: '时间戳 → 日期',
    tsOutput: '时间戳', dateOutput: '日期',
    convert: '转换', copy: '复制', copied: '已复制',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: '毫秒',
    tsPlaceholderSec: '请输入秒级时间戳 (10位)',
    tsPlaceholderMs: '请输入毫秒时间戳 (13位)',
    currentTime: '当前时间', pause: '暂停', resume: '继续',
    localTime: '本地时间', secTs: '秒级时间戳', msTs: '毫秒级时间戳',
    copiedMsg: '已复制到剪贴板', tsUnitSec: '秒', tsUnitMs: '毫秒',
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
  },
  en: {
    secTab: 'Seconds', msTab: 'Milliseconds',
    tzLabel: 'Timezone', toggleEn: '中',
    dateToTs: 'Date → Timestamp', tsToDate: 'Timestamp → Date',
    tsOutput: 'Timestamp', dateOutput: 'Date',
    convert: 'Convert', copy: 'Copy', copied: 'Copied',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:mm:ss', msPlaceholder: 'ms',
    tsPlaceholderSec: 'Enter seconds timestamp (10 digits)',
    tsPlaceholderMs: 'Enter ms timestamp (13 digits)',
    currentTime: 'Current Time', pause: 'Pause', resume: 'Resume',
    localTime: 'Local Time', secTs: 'Seconds TS', msTs: 'Milliseconds TS',
    copiedMsg: 'Copied to clipboard', tsUnitSec: 'sec', tsUnitMs: 'ms',
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
  },
};

let lang = 'zh';
const BUILD = 'v20';
let currentTab = 'sec';
let paused = false;
let lastNow = new Date();
let lastSec = 0;
let lastMs = 0;
let lastUpdateTime = 0;
let timeOffset = 0; // 用于校准的时间偏移

const timezoneEl = $('#timezone');
console.log('timezoneEl初始化结果:', timezoneEl);
console.log('timezoneEl类型:', typeof timezoneEl);
console.log('timezoneEl是否为DOM元素:', timezoneEl instanceof HTMLElement);
console.log('timezoneEl的value:', timezoneEl?.value);
const inputTzEl = $('#input-tz');
const toastEl = $('#toast');
const nowDateEl = $('#now-date');
const nowSecEl = $('#now-sec');
const nowMsEl = $('#now-ms');
const liveDot = $('#live-dot');
const btnPause = $('#btn-pause');
const dateInput = $('#date-input');
const timeInputEl = $('#time-input');
const msInputEl = $('#ms-input');
const tsInput = $('#ts-input');

// 调试：输出时间戳输入框的背景色和外层背景色
console.log('=== 时间戳输入框背景色调试 ===');
const tsInputComputed = window.getComputedStyle(tsInput);
const inputBoxComputed = window.getComputedStyle(tsInput.closest('.input-box'));
console.log('时间戳输入框背景色:', tsInputComputed.backgroundColor);
console.log('输入框容器背景色:', inputBoxComputed.backgroundColor);
console.log('document.body背景色:', window.getComputedStyle(document.body).backgroundColor);
console.log('============================');

// 强制设置时间戳输入框背景色，与日期输入框保持一致
tsInput.style.backgroundColor = 'var(--panel)';
// 设置圆滑的边框
tsInput.style.borderRadius = '12px';
console.log('已设置时间戳输入框边框为12px圆角');
const d2tVal = $('#d2t-val');
const t2dVal = $('#t2d-val');
const t2dResultEl = $('#t2d-result');
const t2dPopoverEl = $('#t2d-popover');
const hintD2t = $('#d2t-hint');
const hintT2d = $('#t2d-hint');
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
const calTimeInputEl = $('#cal-time-input');
const dateSuggestEl = $('#date-suggest');
const dateFieldEl = $('#date-field');

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelected = null;
let calView = 'day';
let calDecadeStart = Math.floor(new Date().getFullYear() / 10) * 10;
let calTime = { hh: 0, mm: 0, ss: 0, ms: 0 };
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

function loadTzConfig() {
  const saved = localStorage.getItem('tz_selected');
  if (saved) {
    try {
      const ids = JSON.parse(saved);
      const list = ids.map(id => lookupZone(id) || { label: id, labelEn: id, value: id })
        .filter(z => z && (z.label || z.labelEn));
      if (list.length > 0) return [{ label: '本地时区', labelEn: 'Local', value: '' }, ...list];
    } catch (e) {}
  }
  return [{ label: '本地时区', labelEn: 'Local', value: '' }, ...DEFAULT_TZ_LIST];
}

function saveTzConfig(selectedValues) {
  localStorage.setItem('tz_selected', JSON.stringify(selectedValues));
}

function resetTzConfig() {
  localStorage.removeItem('tz_selected');
  TIMEZONES = [{ label: '本地时区', labelEn: 'Local', value: '' }, ...DEFAULT_TZ_LIST];
  tzConfigSelected = new Set(DEFAULT_TZ_LIST.map(z => z.value));
  renderTzConfigList();
  applyLang();
}

const tzConfigModal = $('#tz-config-modal');
const tzConfigListEl = $('#timezone-list');
const tzSearchEl = $('#tz-search');
const tzFilterEl = $('#tz-filter');
const btnSaveTzConfig = $('#save-tz-config');
const btnResetTzConfig = $('#reset-tz-config');
const btnTzConfig = $('#tz-config-btn');
const modalCloseEl = $('#modal-close');
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
    const label = lang === 'zh' ? z.label : z.labelEn;
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).join('/')}</span>` : '';
    return `<div class="timezone-item ${selected ? 'selected' : ''}" data-value="${z.value}">
      <div class="timezone-info">
        <div class="timezone-name">${label} ${aliasStr}</div>
        <div class="timezone-offset">${offsetStr} · <span class="timezone-value">${z.value}</span></div>
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
    const label = lang === 'zh' ? z.label : z.labelEn;
    const offsetStr = formatOffset(offsetMinutes(new Date(), z.value));
    const idStr = z.iana ? `<span class="timezone-value">${z.iana}</span>` : `<span class="timezone-value">${z.value}</span>`;
    const aliasStr = zoneAliases(z).length ? `<span class="tz-alias">${zoneAliases(z).join('/')}</span>` : '';
    return `<div class="custom-tz-item" data-value="${z.value}">
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
  toast(lang === 'zh' ? '自定义时区已更新' : 'Custom timezone updated');
}

function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyModalI18n() {
  const emptyTip = customTzListEl && customTzListEl.querySelector('.empty-tip');
  if (emptyTip) emptyTip.textContent = t('noCustomTz');
}

function initTzConfig() {
  const configTabsEl = $('#config-tabs');
  const configPanes = { tz: $('#pane-tz'), fmt: $('#pane-fmt') };
  if (configTabsEl) {
    configTabsEl.querySelectorAll('.config-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        configTabsEl.querySelectorAll('.config-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const name = btn.dataset.tab;
        Object.entries(configPanes).forEach(([k, pane]) => {
          if (pane) pane.classList.toggle('hidden', k !== name);
        });
        const hintTz = $('#hint-tz');
        const hintFmt = $('#hint-fmt');
        if (hintTz) hintTz.classList.toggle('hidden', name !== 'tz');
        if (hintFmt) hintFmt.classList.toggle('hidden', name !== 'fmt');
      });
    });
  }
  if (btnTzConfig) {
    btnTzConfig.addEventListener('click', () => {
      tzConfigModal.classList.add('show');
      renderTzConfigList();
      renderCustomTzList();
    });
  }
  if (modalCloseEl) {
    modalCloseEl.addEventListener('click', () => tzConfigModal.classList.remove('show'));
  }
  tzConfigModal.addEventListener('click', (e) => {
    if (e.target === tzConfigModal) tzConfigModal.classList.remove('show');
  });
  if (btnCustomTzAdd) {
    btnCustomTzAdd.addEventListener('click', () => addCustomTimezone());
    [customTzCnEl, customTzEnEl, customTzOffsetEl].forEach(el => {
      if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTimezone(); });
    });
  }
  if (btnSaveTzConfig) {
    btnSaveTzConfig.addEventListener('click', () => {
      const selected = DEFAULT_TZ_LIST.map(z => z.value).filter(v => tzConfigSelected.has(v)).concat(
        getAllZones().filter(z => tzConfigSelected.has(z.value) && !DEFAULT_TZ_LIST.some(d => d.value === z.value)).map(z => z.value)
      );
      tzConfigSelected.forEach(v => { if (!selected.includes(v)) selected.push(v); });
      saveTzConfig(selected);
      TIMEZONES = [{ label: '本地时区', labelEn: 'Local', value: '' }, ...selected.map(v =>
        lookupZone(v) || { label: v, labelEn: v, value: v }
      )];
      tzConfigModal.classList.remove('show');
      applyLang();
      toast(lang === 'zh' ? '时区配置已保存' : 'Timezone config saved');
    });
  }
  if (btnResetTzConfig) {
    btnResetTzConfig.addEventListener('click', () => resetTzConfig());
  }
  if (tzSearchEl) {
    tzSearchEl.addEventListener('input', () => renderTzConfigList());
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

function formatLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatUTC(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

const tzFormatters = new Map();
function getTzFormatter(tz) {
  if (!tzFormatters.has(tz)) {
    tzFormatters.set(tz, new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false,
    }));
  }
  return tzFormatters.get(tz);
}
function partsMap(parts) { const m = {}; for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value; return m; }

function formatTz(date, tz) {
  if (!tz || tz === 'UTC') return formatUTC(date);
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const t = new Date(date.getTime() + ((+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1)) * 60000);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? '-' + m.year : m.year;
    return `${year}-${m.month}-${m.day} ${pad(m.hour % 24)}:${m.minute}:${m.second}`;
  } catch (e) { return '--'; }
}

const WD_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function tzParts(date, tz) {
  if (!tz || tz === 'UTC') {
    if (tz === 'UTC') {
      return { y: date.getUTCFullYear(), mo: date.getUTCMonth() + 1, d: date.getUTCDate(), h: date.getUTCHours(), mi: date.getUTCMinutes(), se: date.getUTCSeconds(), ms: date.getMilliseconds(), wd: date.getUTCDay() };
    }
    return { y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes(), se: date.getSeconds(), ms: date.getMilliseconds(), wd: date.getDay() };
  }
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const off = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    const t = new Date(date.getTime() + off * 60000);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), se: t.getUTCSeconds(), ms: date.getMilliseconds(), wd: t.getUTCDay() };
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    return { y: m.era === 'BC' ? -Number(m.year) : Number(m.year), mo: Number(m.month), d: Number(m.day), h: Number(m.hour) % 24, mi: Number(m.minute), se: Number(m.second), ms: date.getMilliseconds(), wd: WD_INDEX[m.weekday] };
  } catch (e) { return null; }
}

function formatWithTokens(ms, tz, fmt) {
  const p = tzParts(new Date(ms), tz);
  if (!p) return '--';
  const hour12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const ap = p.h < 12 ? 'AM' : 'PM';
  const map = {
    YYYY: String(p.y), YY: String(Math.abs(p.y)).slice(-2), MM: pad(p.mo), DD: pad(p.d),
    HH: pad(p.h), hh: pad(hour12), mm: pad(p.mi), ss: pad(p.se), SSS: String(p.ms).padStart(3, '0'),
    A: ap, a: ap.toLowerCase(), W: WEEK_CN[WEEK_EN[p.wd]] || '', WD: WEEK_EN[p.wd] || '',
  };
  return fmt.replace(/YYYY|YY|MM|DD|HH|hh|mm|ss|SSS|A|a|W|WD/g, (t) => map[t] !== undefined ? map[t] : t);
}

const DATE_FMT_PRESETS = [
  { label: 'ISO-8601', labelEn: 'ISO-8601', fmt: 'YYYY-MM-DD HH:mm:ss' },
  { label: '斜杠格式', labelEn: 'Slash', fmt: 'YYYY/MM/DD HH:mm:ss' },
  { label: '中文完整', labelEn: 'Chinese', fmt: 'YYYY年MM月DD日 HH:mm:ss' },
  { label: '中文带星期', labelEn: 'Chinese+Week', fmt: 'YYYY年MM月DD日 HH:mm:ss W' },
  { label: '含毫秒', labelEn: 'With ms', fmt: 'YYYY-MM-DD HH:mm:ss.SSS' },
];
const DATE_FMT_DEFAULT_CONST = 'YYYY-MM-DD HH:mm:ss';
const DATE_FMT_MAX_ENABLED = 6;

function offsetMinutes(date, tz) {
  if (!tz) return -date.getTimezoneOffset();
  if (tz === 'UTC') return 0;
  const fx = /^FIXED:([+-])(\d{2})(\d{2})$/.exec(tz);
  if (fx) {
    const mins = (+fx[2] * 60 + +fx[3]) * (fx[1] === '-' ? -1 : 1);
    return mins;
  }
  try {
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    const year = m.era === 'BC' ? -Number(m.year) : Number(m.year);
    const asUtc = Date.UTC(year, Number(m.month) - 1, Number(m.day), Number(m.hour) % 24, Number(m.minute), Number(m.second));
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch (e) { return 0; }
}

function formatOffset(mins) {
  if (!mins) return 'UTC±00:00';
  const sign = mins > 0 ? '+' : '-';
  const abs = Math.abs(mins);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function currentOffsetStr(tz) {
  const mins = offsetMinutes(new Date(), tz);
  if (mins === 0) return '+00:00';
  const sign = mins > 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

function dateToMs(d, tz) {
  const hasMs = typeof d.ms === 'number';
  if (!tz) return hasMs ? new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms).getTime()
                        : new Date(d.y, d.mo - 1, d.d, d.h, d.mi, d.se).getTime();
  const guess = hasMs ? Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se, d.ms)
                      : Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.se);
  return guess - offsetMinutes(new Date(guess), tz) * 60000;
}

function parseRelative(text) {
  const s = text.trim().toLowerCase();
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const DAY_MS = 86400000;
  const rel = {
    today: 0, t: 0, now: 0, '今天': 0,
    yesterday: -1, yes: -1, '昨天': -1,
    tomorrow: 1, tom: 1, '明天': 1,
    '后天': 2, dayafter: 2,
  };
  const n = rel[s];
  if (n === undefined) return null;
  const d = new Date(base.getTime() + n * DAY_MS);
  return { kind: 'date', y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: 0, mi: 0, se: 0 };
}

function parseDate(text) {
  const s = text.trim();
  if (!s) return null;
  const rel = parseRelative(s);
  if (rel) return rel;
  const tzInfo = tzFromDateString(s);
  if (tzInfo) {
    const abs = Date.parse(s);
    if (!Number.isNaN(abs)) return { kind: 'date', abs, tz: tzInfo };
    return null;
  }
  const m = s.match(/^(\d{4})(?:[-/年](\d{1,2}))?(?:[-/月](\d{1,2})(?:日)?)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const y = +m[1];
    if (m[2] == null) return { kind: 'date', y, mo: new Date().getMonth() + 1, d: new Date().getDate(), h: 0, mi: 0, se: 0 };
    const mo = +m[2];
    if (m[3] == null) {
      if (mo >= 1 && mo <= 12) return { kind: 'date', y, mo, d: 1, h: 0, mi: 0, se: 0 };
      return null;
    }
    const d = +m[3];
    const h = m[4] != null ? +m[4] : 0, mi = m[5] != null ? +m[5] : 0, se = m[6] != null ? +m[6] : 0;
    if (mo >= 1 && mo <= 12 && h <= 23 && mi <= 59 && se <= 59) {
      const dim = new Date(y, mo, 0).getDate();
      if (d >= 1 && d <= dim) return { kind: 'date', y, mo, d, h, mi, se };
    }
    return null;
  }
  if (/^-?\d+$/.test(s)) return null;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return { kind: 'stamp', ms: t };
  return null;
}

function tzFromDateString(s) {
  const str = s.trim();
  if (/Z(?:[+-]\d{2}:?\d{2})?$/i.test(str)) return { label: 'UTC', value: 'UTC' };
  if (/\b(UTC|GMT)\b/i.test(str)) return { label: 'UTC', value: 'UTC' };
  const off = /([+-])(\d{2}):?(\d{2})$/.exec(str);
  if (off) {
    const hh = +off[2], mm = +off[3];
    const mins = (hh * 60 + mm) * (off[1] === '-' ? -1 : 1);
    return { label: `${off[1]}${pad(hh)}:${pad(mm)}`, offset: mins, value: `FIXED:${off[1]}${pad(hh)}${pad(mm)}` };
  }
  const rfc = /\b([A-Z]{3,5})\b/.exec(s.replace(/\b(GMT|UTC)\b/gi, ''));
  if (rfc) return { label: rfc[1], value: null };
  return null;
}

function toDateStr(y, mo, d, h, mi, se) {
  return `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(se)}`;
}

function setDateFields(y, mo, d, h, mi, se, ms) {
  dateInput.value = `${pad(y)}-${pad(mo)}-${pad(d)}`;
  timeInputEl.value = `${pad(h)}:${pad(mi)}:${pad(se)}`;
  msInputEl.value = typeof ms === 'number' && ms > 0 ? String(ms).padStart(3, '0') : '';
}

function setDateToNow() {
  const seq = new Date();
  setDateFields(seq.getFullYear(), seq.getMonth() + 1, seq.getDate(), seq.getHours(), seq.getMinutes(), seq.getSeconds(), seq.getMilliseconds());
}

function applyFullDateStr(str) {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return;
  if (m[4] != null) {
    setDateFields(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], 0);
  } else {
    dateInput.value = `${pad(+m[1])}-${pad(+m[2])}-${pad(+m[3])}`;
  }
}
function readDateSelection() {
  const base = dateInput.value.trim();
  const timeText = timeInputEl.value.trim();
  const msText = msInputEl.value.trim();
  if (!base && !timeText && !msText) return { empty: true };
  if (!base) return { err: true };
  const parsed = parseDate(base);
  if (!parsed) return { err: true };
  if (parsed.abs != null) {
    applyParsedTz(parsed.tz);
    return { kind: 'abs', ms: parsed.abs };
  }
  if (parsed.kind !== 'date') return { err: true };
  let h = parsed.h, mi = parsed.mi, se = parsed.se, ms = 0;
  if (timeText) {
    const tm = timeText.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (!tm) return { err: true };
    h = +tm[1]; mi = +tm[2]; se = tm[3] != null ? +tm[3] : 0;
    if (h > 23 || mi > 59 || se > 59) return { err: true };
  }
  if (msText) {
    if (!/^\d{1,3}$/.test(msText)) return { err: true };
    ms = +msText;
  }
  return { y: parsed.y, mo: parsed.mo, d: parsed.d, h, mi, se, ms };
}

function applyParsedTz(tzInfo) {
  if (!tzInfo || !tzInfo.value) return;
  if (tzInfo.value === 'UTC') { inputTzEl.value = 'UTC'; return; }
  if (tzInfo.offset != null) {
    let exists = false;
    for (let i = 0; i < inputTzEl.options.length; i++) {
      if (inputTzEl.options[i].value === tzInfo.value) { exists = true; break; }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = tzInfo.value;
      opt.textContent = tzInfo.label;
      inputTzEl.appendChild(opt);
    }
    inputTzEl.value = tzInfo.value;
  }
}

function buildSuggestions(text) {
  const s = text.trim();
  if (!s) return [];
  const out = [];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const rel = parseRelative(s);
  if (rel) {
    out.push({ date: toDateStr(rel.y, rel.mo, rel.d, 0, 0, 0), desc: t('quick') + ' · ' + s });
  }

  const m = s.match(/^(\d{4})(?:[-/年](\d{1,2}))?(?:[-/月](\d{1,2})(?:日)?)?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const y = +m[1];
    const mo = m[2] != null ? +m[2] : 0;
    const d = m[3] != null ? +m[3] : 0;
    const h = m[4] != null ? +m[4] : 0;
    const mi = m[5] != null ? +m[5] : 0;
    const se = m[6] != null ? +m[6] : 0;
    if (mo >= 1 && mo <= 12) {
      const dim = new Date(y, mo, 0).getDate();
      if (d >= 1 && d <= dim) {
        out.push({ date: toDateStr(y, mo, d, h, mi, se), desc: t('useDate') });
      } else if (d === 0 && mo >= 1 && mo <= 12) {
        out.push({
          month: `${y}-${mo - 1}`,
          date: toDateStr(y, mo, 1, 0, 0, 0),
          desc: `${y}-${pad(mo)} · ${t('quick')}`,
        });
        out.push({ date: toDateStr(y, mo, 15, 0, 0, 0), desc: `${y}-${pad(mo)}-15` });
        out.push({ date: toDateStr(y, mo, dim, 0, 0, 0), desc: `${y}-${pad(mo)}-${pad(dim)}` });
      }
    } else if (mo === 0) {
      out.push({ date: toDateStr(y, 1, 1, 0, 0, 0), desc: `${y}-01-01` });
      out.push({ date: toDateStr(y, now.getMonth() + 1, now.getDate(), 0, 0, 0), desc: `${y}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} (${t('today')})` });
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const it of out) {
    const key = it.date;
    if (!seen.has(key)) { seen.add(key); uniq.push(it); }
  }
  return uniq;
}

function showSuggestions() {
  const items = buildSuggestions(dateInput.value);
  if (!items.length) { dateSuggestEl.classList.remove('open'); return; }
  dateSuggestEl.innerHTML = items.map((it) =>
    `<div class="sg-item" data-date="${it.date}" ${it.month ? `data-month="${it.month}"` : ''}>
      <span class="sg-desc">${it.desc}</span>
      <span class="sg-date">${it.date}</span>
    </div>`).join('');
  dateSuggestEl.classList.add('open');
  dateSuggestEl.dataset.monthMark = items.some((i) => i.month) ? '1' : '';
}

function hideSuggestions() { dateSuggestEl.classList.remove('open'); }


function renderCalendar() {
  const dayMode = calView === 'day';
  const monthMode = calView === 'month';
  const yearMode = calView === 'year';

  calHeadEl.style.display = yearMode ? 'none' : 'flex';
  if (calRightEl) calRightEl.style.display = dayMode ? 'flex' : 'none';

  calTitle.textContent = dayMode
    ? `${calYear}${lang === 'zh' ? '年' : '/'}${pad(calMonth + 1)}${lang === 'zh' ? '月' : ''}`
    : monthMode
      ? `${calYear}${lang === 'zh' ? '年' : ''}`
      : `${calDecadeStart} - ${calDecadeStart + 9}`;

  calBodyDay.style.display = dayMode ? 'block' : 'none';
  calBodyMonth.style.display = monthMode ? 'block' : 'none';
  calBodyYear.style.display = yearMode ? 'block' : 'none';

  if (dayMode) renderDayGrid();
  if (monthMode) renderMonths();
  if (yearMode) renderYears();
  if (!skipViewSync) syncViewInput();
}

function syncViewInput() {
  if (calView === 'day') {
    const d = (calSelected && calSelected.y === calYear && calSelected.mo === calMonth) ? calSelected.d : 1;
    calYearInputEl.value = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
  } else if (calView === 'month') {
    calYearInputEl.value = `${calYear}-${pad(calMonth + 1)}`;
  } else {
    calYearInputEl.value = `${calYear}`;
  }
}

function renderDayGrid() {
  const first = new Date(calYear, calMonth, 1);
  const dim = new Date(calYear, calMonth + 1, 0).getDate();
  const startDow = first.getDay();
  const today = new Date();
  calGrid.innerHTML = '';
  for (let i = 0; i < startDow; i++) calGrid.appendChild(el('button', 'cal-day empty', ''));
  for (let d = 1; d <= dim; d++) {
    const btn = el('button', 'cal-day', String(d));
    const dow = (startDow + d - 1) % 7;
    if (dow === 0 || dow === 6) btn.classList.add('weekend');
    const isSel = calSelected && calSelected.y === calYear && calSelected.mo === calMonth && calSelected.d === d;
    if (isSel) btn.classList.add('selected');
    if (d === today.getDate() && calYear === today.getFullYear() && calMonth === today.getMonth()) btn.classList.add('today');
    btn.addEventListener('click', (e) => { e.stopPropagation(); selectDay(d); });
    calGrid.appendChild(btn);
  }
}

function renderMonths() {
  const MONTHS = lang === 'zh'
    ? ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  calMonthsEl.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const btn = el('button', 'cal-month', MONTHS[i]);
    const isSel = calSelected && calSelected.y === calYear && calSelected.mo === i;
    if (isSel) btn.classList.add('selected');
    const cur = new Date();
    if (calYear === cur.getFullYear() && i === cur.getMonth()) btn.classList.add('today');
    if (i === calMonth) btn.classList.add('edited');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      calMonth = i;
      calView = 'day';
      renderCalendar();
    });
    calMonthsEl.appendChild(btn);
  }
}

function renderYears() {
  calYearHeadEl.innerHTML = `
    <div class="cal-nav-group">
      <button type="button" class="cal-nav tiny" data-step="-1000" title="-1000">&lt;&lt;&lt;</button>
      <button type="button" class="cal-nav tiny" data-step="-100" title="-100">&lt;&lt;</button>
      <button type="button" class="cal-nav tiny" data-step="-10" title="-10">&lt;</button>
    </div>
    <span class="cal-range">${calDecadeStart} - ${calDecadeStart + 9}</span>
    <div class="cal-nav-group">
      <button type="button" class="cal-nav tiny" data-step="10" title="+10">&gt;</button>
      <button type="button" class="cal-nav tiny" data-step="100" title="+100">&gt;&gt;</button>
      <button type="button" class="cal-nav tiny" data-step="1000" title="+1000">&gt;&gt;&gt;</button>
    </div>`;

  calYearsEl.innerHTML = '';
  for (let y = calDecadeStart; y <= calDecadeStart + 9; y++) {
    const btn = el('button', 'cal-year', String(y));
    if (y === calYear) btn.classList.add('selected');
    const cur = new Date().getFullYear();
    if (y === cur) btn.classList.add('today');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      calYear = y;
      calView = 'month';
      renderCalendar();
    });
    calYearsEl.appendChild(btn);
  }
}

function showMonthView() { calView = 'month'; renderCalendar(); }
function showYearView() { calDecadeStart = Math.floor(calYear / 10) * 10; calView = 'year'; calYearInputEl.value = String(calYear); renderCalendar(); }

function clampDayInMonth(y, mo, d) { const dim = new Date(y, mo + 1, 0).getDate(); return Math.min(d || 1, dim); }

function followYearInput() {
  const raw = calYearInputEl.value.trim();
  calYearInputEl.classList.remove('err-jump');
  if (!raw) return;
  skipViewSync = true;
  try {
    const inRange = (y) => validate(new Date(y, 0, 1).getTime()) && validate(new Date(y, 11, 31, 23, 59, 59, 999).getTime());

    const yOnly = raw.match(/^(\d{1,4})$/);
    if (yOnly) {
      const y = +yOnly[1].padEnd(4, '0');
      if (!inRange(y)) return;
      calYear = y;
      calView = 'year';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }

    const ym = raw.match(/^(\d{4})[-\/年](\d{1,2})$/);
    if (ym) {
      const y = +ym[1], mo = +ym[2];
      if (!inRange(y) || mo < 1 || mo > 12) return;
      calYear = y; calMonth = mo - 1;
      calView = 'month';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }

    const ymd = raw.match(/^(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})(?:日)?$/);
    if (ymd) {
      const y = +ymd[1], mo = +ymd[2], d = +ymd[3];
      if (!inRange(y) || mo < 1 || mo > 12) return;
      const dim = new Date(y, mo, 0).getDate();
      if (d < 1 || d > dim) return;
      calYear = y; calMonth = mo - 1;
      calSelected = { y, mo: mo - 1, d };
      calView = 'day';
      calDecadeStart = Math.floor(y / 10) * 10;
      renderCalendar();
      return;
    }
  } finally {
    skipViewSync = false;
  }
}

function jumpToYearInput() {
  const raw = calYearInputEl.value.trim();
  if (!raw) { renderCalendar(); return; }
  const p = parseDate(raw);
  if (!p || p.kind !== 'date') { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast('无效年份'); return; }
  const y = p.y;
  const dt = new Date(y, 0, 1);
  const start = dt.getTime();
  const endMs = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
  if (!validate(start) || !validate(endMs)) { calYearInputEl.classList.add('err-jump'); calYearInputEl.value = ''; toast('超出时间戳范围'); return; }
  calYear = y;
  if (!/^\d{4}$/.test(raw)) {
    const mo = p.mo - 1;
    const d = clampDayInMonth(y, mo, p.d || (calSelected ? calSelected.d : 1));
    calMonth = mo;
    calSelected = { y, mo, d };
    calTime.hh = p.h; calTime.mm = p.mi; calTime.ss = p.se;
    setDateFields(y, mo + 1, d, p.h, p.mi, p.se, 0);
    renderTimeWheels();
    renderConvert();
  } else {
    calMonth = calSelected && calSelected.y === y ? calSelected.mo : 0;
    calSelected = { y, mo: calMonth, d: clampDayInMonth(y, calMonth, calSelected ? calSelected.d : 1) };
  }
  calDecadeStart = Math.floor(y / 10) * 10;
  calView = 'day';
  renderTimeWheels();
  renderCalendar();
  renderConvert();
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  node.textContent = text;
  return node;
}

function selectDay(d) {
  calSelected = { y: calYear, mo: calMonth, d };
  renderCalendar();
}

function openCalendar() {
  hideSuggestions();
  calView = 'day';
  const now = new Date();
  const isEmpty = !dateInput.value.trim() && !timeInputEl.value.trim() && !msInputEl.value.trim();
  if (isEmpty) {
    calYear = now.getFullYear(); calMonth = now.getMonth();
    calSelected = { y: now.getFullYear(), mo: now.getMonth(), d: now.getDate() };
    calDecadeStart = Math.floor(now.getFullYear() / 10) * 10;
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds() };
  } else {
    const parsed = parseDate(dateInput.value);
    if (parsed && parsed.kind === 'date') {
      calYear = parsed.y; calMonth = parsed.mo - 1;
      calSelected = { y: parsed.y, mo: parsed.mo - 1, d: parsed.d };
    } else {
      calSelected = null;
    }
    calTime = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds(), ms: now.getMilliseconds() };
    const tm = timeInputEl.value.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (tm) {
      calTime.hh = Math.min(23, +tm[1]); calTime.mm = Math.min(59, +tm[2]);
      calTime.ss = tm[3] != null ? Math.min(59, +tm[3]) : 0;
    }
    const msT = msInputEl.value.trim();
    if (/^\d{1,3}$/.test(msT)) calTime.ms = +msT;
  }
  renderTimeWheels();
  renderCalendar();
  calendarEl.classList.add('open');
  syncTimeInput();
  if (window.console) console.log('[debug openCalendar]', 'tab=' + currentTab, 'systemTime=' + new Date().toString(), 'inputTz=' + inputTzEl.value, 'calTime=', JSON.stringify(calTime), 'dateIn=' + JSON.stringify(dateInput.value), 'timeIn=' + JSON.stringify(timeInputEl.value), 'msIn=' + JSON.stringify(msInputEl.value), 'timeInputDom=' + JSON.stringify(calTimeInputEl.value));
}

function closeCalendar() { calendarEl.classList.remove('open'); }

const WHEEL_H = 44;
const WHEEL_VIEW = 132;

function renderTimeWheels() {
  wheelMs.style.display = currentTab === 'ms' ? '' : 'none';
  const msCol = wheelMs.parentNode;
  if (msCol) msCol.style.display = currentTab === 'ms' ? '' : 'none';
  buildWheel(wheelHh, 24, calTime.hh, (v) => { calTime.hh = v; applyWheelTime(); });
  buildWheel(wheelMm, 60, calTime.mm, (v) => { calTime.mm = v; applyWheelTime(); });
  buildWheel(wheelSs, 60, calTime.ss, (v) => { calTime.ss = v; applyWheelTime(); });
  buildWheel(wheelMs, 1000, calTime.ms, (v) => { calTime.ms = v; applyWheelTime(); });
  if (!skipTimeSync) syncTimeInput();
}

function syncTimeInput() {
  const t = calTime;
  const base = `${pad(t.hh)}:${pad(t.mm)}:${pad(t.ss)}`;
  calTimeInputEl.value = currentTab === 'ms' ? `${base}.${String(t.ms).padStart(3, '0')}` : base;
}

function followTimeInput() {
  const raw = calTimeInputEl.value.trim();
  if (!raw) { renderTimeWheels(); return; }
  const parts = raw.split(':');
  const hh = +parts[0] || 0;
  const readMmSs = (seg) => {
    const sp = seg.split('.');
    return [ +sp[0] || 0, sp[1] ? +sp[1].padEnd(3, '0').slice(0, 3) : 0 ];
  };
  let mm = 0, ss = 0, ms = 0;
  if (parts[1]) { const r = readMmSs(parts[1]); mm = r[0]; ms = r[1]; }
  if (parts[2]) { const r = readMmSs(parts[2]); ss = r[0]; ms = r[1]; }
  if (hh > 23 || mm > 59 || ss > 59) return;
  calTime.hh = hh; calTime.mm = mm; calTime.ss = ss; calTime.ms = ms;
  skipTimeSync = true;
  try {
    renderTimeWheels();
    applyWheelTime();
  } finally {
    skipTimeSync = false;
  }
}

function applyWheelTime() {
  if (!skipTimeSync) syncTimeInput();
}

function clampWheel(i, max) { return i < 0 ? 0 : (i > max ? max : i); }

function highlightWheel(el, idx) {
  console.log('=== highlightWheel 被调用 ===');
  console.log('元素:', el);
  console.log('选中索引:', idx);
  console.log('子元素数量:', el.children.length);
  console.log('当前滚动位置:', el.scrollTop);
  console.log('元素高度:', el.offsetHeight);
  console.log('元素可见高度:', el.clientHeight);
  console.log('元素滚动高度:', el.scrollHeight);
  
  Array.prototype.forEach.call(el.children, (c, i) => {
    const wasSel = c.classList.contains('sel');
    const willBeSel = i === idx;
    c.classList.toggle('sel', willBeSel);
    
    if (wasSel !== willBeSel) {
      console.log(`wheel-item ${i}: ${wasSel ? '移除' : '添加'} sel 类`);
      if (willBeSel) {
        console.log('=== 选中项详细信息 ===');
        console.log('元素文本:', c.textContent);
        console.log('元素尺寸:', {
          offsetHeight: c.offsetHeight,
          clientHeight: c.clientHeight,
          scrollHeight: c.scrollHeight,
          height: c.style.height,
          lineHeight: c.style.lineHeight,
          paddingTop: c.style.paddingTop,
          paddingBottom: c.style.paddingBottom,
          borderTop: c.style.borderTop,
          borderBottom: c.style.borderBottom
        });
        console.log('计算样式:', getComputedStyle(c));
        console.log('=== 选中项详细信息结束 ===');
      }
    }
  });
  console.log('=== highlightWheel 调用结束 ===');
}

function wheelIndexFromScrollTop(el) {
  const step = el._step || WHEEL_H;
  const calculatedIndex = Math.round(el.scrollTop / step);
  const clampedIndex = clampWheel(calculatedIndex, el.children.length - 1);
  return clampedIndex;
}

function selectWheelValue(el, i, onChange, step) {
  const s = step || el._step || WHEEL_H;
  el._sel = i;
  el.scrollTop = i * s;
  highlightWheel(el, i);
  if (onChange) onChange(i);
}

function buildWheel(el, count, cur, onChange) {
  el.innerHTML = '';
  el.style.paddingTop = ((WHEEL_VIEW - WHEEL_H) / 2) + 'px';
  el.style.paddingBottom = ((WHEEL_VIEW - WHEEL_H) / 2) + 'px';
  for (let i = 0; i < count; i++) {
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = String(i).padStart(2, '0');
    it.addEventListener('click', (e) => { e.stopPropagation(); selectWheelValue(el, i, onChange); });
    el.appendChild(it);
  }
  el._sel = clampWheel(cur, count - 1);
  el._step = WHEEL_H;
  highlightWheel(el, el._sel);
  el._suspend = true;
  const apply = () => { el.scrollTop = el._sel * WHEEL_H; };
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(apply);
  else apply();
  if (typeof setTimeout !== 'undefined') setTimeout(() => { el._suspend = false; }, 150);
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const ni = clampWheel(el._sel + dir, count - 1);
    if (ni === el._sel) return;
    el._sel = ni;
    highlightWheel(el, ni);
    el._suspend = true;
    el.scrollTop = ni * WHEEL_H;
    if (typeof setTimeout !== 'undefined') setTimeout(() => { el._suspend = false; }, 220);
    if (onChange) onChange(ni);
  }, { passive: false });
  el.addEventListener('scroll', () => {
    if (el._suspend) return;
    const idx = wheelIndexFromScrollTop(el);
    if (idx !== el._sel) { el._sel = idx; highlightWheel(el, idx); if (onChange) onChange(idx); }
  });
}

function setCalendarMonth(year, month) {
  calYear = year; calMonth = month;
  calView = 'day';
  renderCalendar();
}

function calNavigate(dir) {
  if (calView === 'day') {
    setCalendarMonth(calMonth + dir < 0 ? calYear - 1 : (calMonth + dir > 11 ? calYear + 1 : calYear), (calMonth + dir + 12) % 12);
  } else if (calView === 'month') {
    calYear += dir;
    renderCalendar();
  } else if (calView === 'year') {
    calDecadeStart += dir * 10;
    renderCalendar();
  }
}

function validate(ms) {
  return Number.isFinite(ms) && ms >= MIN_TS && ms <= MAX_TS;
}

function t(keys) {
  return keys.split('.').reduce((o, k) => o[k], I18N[lang]);
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1300);
}

function copyText(text, btn) {
  if (window.utools) utools.copyText(String(text));
  else if (navigator.clipboard) navigator.clipboard.writeText(String(text));
  toast(t('copiedMsg'));
  if (btn) {
    const old = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 900);
  }
}

function updateNow() {
  if (paused) return;
  
  const now = Date.now();
  const currentRealTime = now + timeOffset;
  
  // 如果是第一次更新或者距离上次更新超过5秒，重新校准时间
  if (lastUpdateTime === 0 || now - lastUpdateTime > 5000) {
    lastNow = new Date();
    lastSec = Math.floor(currentRealTime / 1000);
    lastMs = currentRealTime;
    lastUpdateTime = now;
    console.log('时间校准 - 当前时间:', new Date(currentRealTime).toLocaleString());
  } else {
    // 获取当前的真实秒数
    const currentSec = Math.floor(currentRealTime / 1000);
    
    // 更新秒数
    if (currentSec !== lastSec) {
      lastSec = currentSec;
      console.log('秒数变化:', lastSec);
    }
    
    // 模拟毫秒快速滚动：在当前秒内，毫秒从000快速滚动到999
    // 基于当前秒内的真实时间比例计算显示的毫秒
    const secondProgress = (currentRealTime % 1000) / 1000; // 0.0 到 1.0
    const simulatedMs = Math.floor(secondProgress * 1000); // 0 到 999
    
    lastMs = lastSec * 1000 + simulatedMs;
    lastUpdateTime = now;
  }
  
  // 更新显示
  const displayDate = new Date(lastMs);
  nowDateEl.textContent = formatLocal(displayDate);
  nowSecEl.textContent = lastSec;
  nowMsEl.textContent = lastMs;
  
  // 每秒输出一次毫秒变化信息
  if (lastUpdateTime % 1000 < 50) {
    console.log('当前毫秒:', lastMs % 1000, '秒数:', lastSec);
  }
}

function setResult(valEl, text, state) {
  valEl.dataset.value = state === 'empty' || state === 'err' ? '' : (valEl.dataset.value || '');
  valEl.setAttribute('aria-result', state || '');
  valEl.textContent = text;
  valEl.classList.toggle('placeholder', state === 'empty' || state === 'err');
  valEl.classList.remove('copied');
}

function setHint(hintEl, text, state) {
  hintEl.textContent = text || '';
  hintEl.className = 'input-hint' + (state ? ' ' + state : '');
}

function renderConvert() {
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const sel = readDateSelection();
  d2tVal.dataset.value = '';
  if (sel.empty) {
    setResult(d2tVal, '', 'empty');
    setHint(hintD2t, '', '');
    return;
  }
  if (sel.err) {
    setResult(d2tVal, t('invalidDate'), 'err');
    setHint(hintD2t, t('invalidDate'), 'err');
    return;
  }
  let ms;
  if (sel.kind === 'abs') {
    ms = sel.ms;
  } else {
    ms = dateToMs(sel, inputTzEl.value);
  }
  if (!validate(ms)) {
    setResult(d2tVal, t('outOfRange'), 'err');
    setHint(hintD2t, '', '');
    return;
  }
  const secVal = String(Math.floor(ms / 1000));
  const msVal = String(ms);
  const text = isSec ? secVal : msVal;
  d2tVal.dataset.value = isSec ? secVal : msVal;
  setResult(d2tVal, text, 'ok');
  setHint(hintD2t, '', '');
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function tzWeekday(date, tz) {
  try {
    if (!tz) return WEEK_CN[DAYS[date.getDay()]];
    const m = partsMap(getTzFormatter(tz).formatToParts(date));
    return WEEK_CN[m.weekday] || '';
  } catch (e) { return ''; }
}

function renderReverse() {
  const tz = timezoneEl.value;
  const isSec = currentTab === 'sec';
  const raw = tsInput.value.trim();
  t2dVal.dataset.value = '';
  if (!raw) {
    setResult(t2dVal, '', 'empty');
    setHint(hintT2d, '', '');
    return;
  }
  const num = raw.match(/^(-?)(\d+)$/);
  if (!num) {
    setResult(t2dVal, t('invalidTs'), 'err');
    setHint(hintT2d, t('invalidTs'), 'err');
    return;
  }
  const n = Number(raw);
  const ms = isSec ? n * 1000 : n;
  if (!validate(ms)) {
    setResult(t2dVal, t('outOfRange'), 'err');
    setHint(hintT2d, t('outOfRange'), 'err');
    return;
  }
  const date = new Date(ms);
  const text = formatWithTokens(ms, tz, defaultDateFmt());
  t2dVal.dataset.value = (isSec ? Math.floor(ms / 1000) : ms).toString();
  setResult(t2dVal, text, 'ok');
  setHint(hintT2d, '', '');
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function currentT2dMs() {
  const v = t2dVal.dataset.value;
  if (v === '' || v === undefined) return null;
  const n = Number(v);
  return currentTab === 'sec' ? n * 1000 : n;
}

function renderT2dPopover() {
  const ms = currentT2dMs();
  if (ms === null) return;
  const tz = timezoneEl.value;
  const items = currentDateFormats().map(f => {
    const val = formatWithTokens(ms, tz, f.fmt);
    return `<div class="t2d-pop-item" data-value="${htmlEscape(val)}"><div class="t2d-pop-fmt">${htmlEscape(f.fmt)}</div><div class="t2d-pop-val">${htmlEscape(val)}</div></div>`;
  }).join('');
  t2dPopoverEl.innerHTML = items;
}

let DATE_FMT_CUSTOM = loadDateFmtCustom();
let DATE_FMT_ENABLED = loadDateFmtEnabled();
let DATE_FMT_ORDER = loadDateFmtOrder();
let fmtEditingIndex = -1;

function fmtAlias(fmt) {
  const hit = DATE_FMT_PRESETS.find(p => p.fmt === fmt);
  if (hit) return lang === 'zh' ? hit.label : hit.labelEn;
  const c = DATE_FMT_CUSTOM.find(c => c.fmt === fmt);
  return c ? c.label : fmt;
}
function loadDateFmtCustom() {
  try {
    const raw = localStorage.getItem('date_fmt_custom');
    const a = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(a)) return [];
    return a.map(x => typeof x === 'string' ? { label: x, fmt: x } : { label: x.label || x.fmt, fmt: x.fmt }).filter(x => x.fmt);
  } catch (e) { return []; }
}
function loadDateFmtEnabled() {
  try {
    const raw = localStorage.getItem('date_fmt_enabled');
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) {
        const arr = a.filter(Boolean).slice(0, DATE_FMT_MAX_ENABLED);
        return new Set(arr);
      }
    }
  } catch (e) {}
  return new Set(DATE_FMT_PRESETS.map(p => p.fmt).concat(DATE_FMT_CUSTOM.map(c => c.fmt)).slice(0, DATE_FMT_MAX_ENABLED));
}
function loadDateFmtOrder() {
  try {
    const raw = localStorage.getItem('date_fmt_order');
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a) && a.length) {
        const order = a.filter(Boolean);
        const merged = [];
        for (const f of order.concat(DATE_FMT_PRESETS.map(p => p.fmt)).concat(DATE_FMT_CUSTOM.map(c => c.fmt))) {
          if (!merged.includes(f)) merged.push(f);
        }
        return merged;
      }
    }
  } catch (e) {}
  return DATE_FMT_PRESETS.map(p => p.fmt).concat(DATE_FMT_CUSTOM.map(c => c.fmt));
}
function normalizeOrder() {
  const enabled = DATE_FMT_ORDER.filter(f => DATE_FMT_ENABLED.has(f));
  const others = DATE_FMT_ORDER.filter(f => !DATE_FMT_ENABLED.has(f));
  DATE_FMT_ORDER = enabled.concat(others);
}
function saveDateFmtConfig() {
  localStorage.setItem('date_fmt_custom', JSON.stringify(DATE_FMT_CUSTOM));
  localStorage.setItem('date_fmt_enabled', JSON.stringify([...DATE_FMT_ENABLED]));
  normalizeOrder();
  localStorage.setItem('date_fmt_order', JSON.stringify(DATE_FMT_ORDER));
}
function allDateFmts() {
  return [...DATE_FMT_PRESETS, ...DATE_FMT_CUSTOM];
}
function defaultDateFmt() {
  const firstEnabled = DATE_FMT_ORDER.find(f => DATE_FMT_ENABLED.has(f));
  return firstEnabled || DATE_FMT_ORDER[0] || DATE_FMT_DEFAULT_CONST;
}
function currentDateFormats() {
  const def = defaultDateFmt();
  const res = [];
  for (const fmt of DATE_FMT_ORDER) {
    if (!DATE_FMT_ENABLED.has(fmt) || fmt === def) continue;
    const p = DATE_FMT_PRESETS.find(p => p.fmt === fmt);
    const c = DATE_FMT_CUSTOM.find(c => c.fmt === fmt);
    res.push({ fmt, label: c ? c.label : (p ? (lang === 'zh' ? p.label : p.labelEn) : fmt) });
  }
  return res;
}
let fmtDrag = null;
let fmtDragJustMoved = false;
function bindFmtList(el) {
  el.querySelectorAll('.timezone-item').forEach(item => {
    const handle = item.querySelector('.fmt-drag');
    if (handle) {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startFmtDrag(e, item, el);
      });
    }
    item.addEventListener('mousedown', (e) => {
      if (e.target.closest('.fmt-drag')) return;
      if (e.button !== 0) return;
      if (fmtDrag) return;
      const sx = e.clientX, sy = e.clientY;
      const moveCheck = (ev) => {
        if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3) {
          window.removeEventListener('mousemove', moveCheck);
          window.removeEventListener('mouseup', clearCheck);
          startFmtDrag(ev, item, el);
        }
      };
      const clearCheck = () => {
        window.removeEventListener('mousemove', moveCheck);
        window.removeEventListener('mouseup', clearCheck);
      };
      window.addEventListener('mousemove', moveCheck);
      window.addEventListener('mouseup', clearCheck);
    });
    item.addEventListener('click', (e) => {
      if (fmtDragJustMoved) { fmtDragJustMoved = false; return; }
      if (e.target.closest('.fmt-drag')) return;
      const fmt = item.dataset.fmt;
      if (DATE_FMT_ENABLED.has(fmt)) DATE_FMT_ENABLED.delete(fmt);
      else {
        if (DATE_FMT_ENABLED.size >= DATE_FMT_MAX_ENABLED) {
          toast(lang === 'zh' ? `最多同时启用 ${DATE_FMT_MAX_ENABLED} 个格式` : `At most ${DATE_FMT_MAX_ENABLED} formats enabled`);
          return;
        }
        DATE_FMT_ENABLED.add(fmt);
      }
      saveDateFmtConfig();
      renderDateFormatList();
      renderReverse();
    });
  });
}
function applyPresetOrder(presetOrderList) {
  const customs = DATE_FMT_ORDER.filter(f => !DATE_FMT_PRESETS.some(p => p.fmt === f));
  DATE_FMT_ORDER = [...presetOrderList, ...customs];
}
function startFmtDrag(e, item, el) {
  if (fmtDrag) return;
  const fmt = item.dataset.fmt;
  const rect = item.getBoundingClientRect();
  const ghost = item.cloneNode(true);
  ghost.classList.add('fmt-drag-ghost');
  ghost.style.width = rect.width + 'px';
  ghost.style.left = rect.left + 'px';
  ghost.style.top = rect.top + 'px';
  document.body.appendChild(ghost);
  el.classList.add('fmt-live-drag');
  item.classList.add('dragging');
  fmtDrag = {
    fmt, el, ghost,
    startY: e.clientY,
    ghostTop: rect.top,
    offsetY: e.clientY - rect.top,
    enabled: DATE_FMT_ENABLED.has(fmt),
    moved: false
  };
  window.addEventListener('mousemove', onFmtDragMove);
  window.addEventListener('mouseup', onFmtDragUp);
}
function onFmtDragMove(ev) {
  const st = fmtDrag;
  if (!st) return;
  st.moved = true;
  st.ghost.style.top = (st.ghostTop + (ev.clientY - st.startY)) + 'px';
  liveReorderFmt(ev.clientY, st);
}
function liveReorderFmt(clientY, st) {
  const items = [...st.el.querySelectorAll('.timezone-item')];
  const draggedRow = items.find(it => it.dataset.fmt === st.fmt);
  if (!draggedRow) return;
  let targetRow = null, placeBefore = true;
  for (const it of items) {
    if (it === draggedRow) continue;
    if (DATE_FMT_ENABLED.has(it.dataset.fmt) !== st.enabled) continue;
    const r = it.getBoundingClientRect();
    if (clientY < r.top + r.height / 2) { targetRow = it; placeBefore = true; break; }
    targetRow = it; placeBefore = false;
  }
  if (!targetRow) return;
  const refIndex = items.indexOf(targetRow);
  const dragIndex = items.indexOf(draggedRow);
  let wantIndex = placeBefore ? refIndex : refIndex + 1;
  if (placeBefore && dragIndex < refIndex) wantIndex = refIndex - 1;
  if (dragIndex === wantIndex) return;
  if (placeBefore) st.el.insertBefore(draggedRow, targetRow);
  else st.el.insertBefore(draggedRow, targetRow.nextSibling);
  applyPresetOrder([...st.el.querySelectorAll('.timezone-item')].map(x => x.dataset.fmt));
  draggedRow.classList.add('dragging');
}
function onFmtDragUp() {
  const st = fmtDrag;
  if (!st) return;
  window.removeEventListener('mousemove', onFmtDragMove);
  window.removeEventListener('mouseup', onFmtDragUp);
  if (st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
  st.el.classList.remove('fmt-live-drag');
  fmtDrag = null;
  if (st.moved) fmtDragJustMoved = true;
  saveDateFmtConfig();
  renderDateFormatList();
  renderReverse();
}
function renderDateFormatList() {
  const el = $('#date-format-list');
  const searchEl = $('#date-fmt-search');
  if (!el) return;
  const query = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const def = defaultDateFmt();
  normalizeOrder();
  const shown = DATE_FMT_ORDER
    .filter(f => DATE_FMT_PRESETS.some(p => p.fmt === f))
    .filter(f => {
      if (!query) return true;
      if (fmtAlias(f).toLowerCase().includes(query)) return true;
      if (f.toLowerCase().includes(query)) return true;
      return false;
    });
  const enabledShown = shown.filter(f => DATE_FMT_ENABLED.has(f));
  const disabledShown = shown.filter(f => !DATE_FMT_ENABLED.has(f));
  let html = '';
  if (enabledShown.length) {
    if (query && disabledShown.length) html += `<div class="fmt-group-hdr">已选中</div>`;
    html += enabledShown.map(fmt => fmtRow(fmt, def)).join('');
  }
  if (disabledShown.length) {
    if (enabledShown.length) html += `<div class="fmt-group-hdr">未选中</div>`;
    html += disabledShown.map(fmt => fmtRow(fmt, def)).join('');
  }
  el.innerHTML = html || `<div class="empty-tip">暂无匹配格式</div>`;
  bindFmtList(el);
}
function renderCustomFmtList() {
  const el = $('#custom-fmt-list');
  if (!el) return;
  if (DATE_FMT_CUSTOM.length === 0) {
    el.innerHTML = `<div class="empty-tip" data-i18n="noCustomFmt">暂无自定义格式</div>`;
    applyModalI18n();
    return;
  }
  el.innerHTML = DATE_FMT_CUSTOM.map((c, idx) => {
    if (fmtEditingIndex === idx) {
      return `<div class="custom-tz-item editing" data-index="${idx}">
        <div class="custom-fmt-edit-form">
          <div class="custom-tz-form-row">
            <input type="text" class="edit-label" value="${escapeAttr(c.label)}" placeholder="别名">
            <input type="text" class="edit-fmt" value="${escapeAttr(c.fmt)}" placeholder="格式串">
          </div>
          <div class="custom-tz-form-row">
            <button class="custom-fmt-save">${lang === 'zh' ? '保存' : 'Save'}</button>
            <button class="custom-fmt-cancel">${lang === 'zh' ? '取消' : 'Cancel'}</button>
          </div>
        </div>
      </div>`;
    }
    const alias = fmtAlias(c.fmt);
    return `<div class="custom-tz-item" data-index="${idx}">
      <div class="timezone-info">
        <div class="timezone-name">${alias}</div>
        <div class="timezone-offset"><span class="timezone-value">${htmlEscape(c.fmt)}</span></div>
      </div>
      <div class="custom-tz-actions">
        <button class="custom-fmt-edit" title="${lang === 'zh' ? '编辑' : 'Edit'}">✎</button>
        <button class="custom-fmt-del" title="${lang === 'zh' ? '删除' : 'Delete'}">✕</button>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.custom-tz-item').forEach(item => {
    if (item.classList.contains('editing')) {
      const idx = parseInt(item.dataset.index);
      item.querySelector('.custom-fmt-save').addEventListener('click', (e) => {
        e.stopPropagation();
        saveEditCustomFormat(idx, item);
      });
      item.querySelector('.custom-fmt-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        fmtEditingIndex = -1;
        renderCustomFmtList();
      });
      return;
    }
    const idx = parseInt(item.dataset.index);
    item.querySelector('.custom-fmt-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      fmtEditingIndex = idx;
      renderCustomFmtList();
    });
    item.querySelector('.custom-fmt-del').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCustomFormat(idx);
    });
  });
}
function saveEditCustomFormat(idx, item) {
  if (idx < 0 || idx >= DATE_FMT_CUSTOM.length) return;
  const c = DATE_FMT_CUSTOM[idx];
  const newLabel = (item.querySelector('.edit-label').value || '').trim();
  const newFmt = (item.querySelector('.edit-fmt').value || '').trim();
  if (!newFmt) { toast(lang === 'zh' ? '格式不能为空' : 'Format is required'); return; }
  if (DATE_FMT_CUSTOM.some((ci, i) => i !== idx && ci.fmt === newFmt) || DATE_FMT_PRESETS.some(p => p.fmt === newFmt)) {
    toast(lang === 'zh' ? '格式已存在' : 'Duplicate format');
    return;
  }
  c.label = newLabel || newFmt;
  c.fmt = newFmt;
  fmtEditingIndex = -1;
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
}
function removeCustomFormat(idx) {
  if (idx < 0 || idx >= DATE_FMT_CUSTOM.length) return;
  const c = DATE_FMT_CUSTOM[idx];
  DATE_FMT_CUSTOM.splice(idx, 1);
  DATE_FMT_ENABLED.delete(c.fmt);
  DATE_FMT_ORDER = DATE_FMT_ORDER.filter(f => f !== c.fmt);
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
}
function fmtRow(fmt, def) {
  const enabled = DATE_FMT_ENABLED.has(fmt);
  const isDefault = fmt === def;
  const custom = DATE_FMT_CUSTOM.some(c => c.fmt === fmt);
  const alias = htmlEscape(fmtAlias(fmt));
  return `<div class="timezone-item ${enabled ? 'selected' : ''}" data-fmt="${htmlEscape(fmt)}">
    <span class="fmt-drag" title="拖动排序">☰</span>
    <div class="timezone-info">
      <div class="timezone-name">${isDefault ? '<span class="fmt-def-badge">默认</span> ' : ''}${alias}</div>
      <div class="timezone-offset"><span class="timezone-value">${htmlEscape(fmt)}</span></div>
    </div>
    <div class="fmt-actions"><span class="tz-check">${enabled ? '✓' : ''}</span></div>
  </div>`;
}
function addCustomFormat() {
  const labelEl = $('#custom-fmt-label');
  const inputEl = $('#custom-fmt-input');
  if (!inputEl) return;
  const fmt = (inputEl.value || '').trim();
  const label = (labelEl && labelEl.value.trim()) || fmt;
  if (!fmt) { toast(lang === 'zh' ? '格式不能为空' : 'Format is required'); return; }
  if (DATE_FMT_CUSTOM.some(c => c.fmt === fmt) || DATE_FMT_PRESETS.some(p => p.fmt === fmt)) {
    toast(lang === 'zh' ? '格式已存在' : 'Duplicate format');
    return;
  }
  DATE_FMT_CUSTOM.push({ label, fmt });
  if (DATE_FMT_ENABLED.size < DATE_FMT_MAX_ENABLED) DATE_FMT_ENABLED.add(fmt);
  DATE_FMT_ORDER.push(fmt);
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  if (labelEl) labelEl.value = '';
  if (inputEl) inputEl.value = '';
}
function resetDateFormats() {
  DATE_FMT_ENABLED = new Set(DATE_FMT_PRESETS.map(p => p.fmt));
  DATE_FMT_CUSTOM = [];
  DATE_FMT_ORDER = DATE_FMT_PRESETS.map(p => p.fmt);
  fmtEditingIndex = -1;
  saveDateFmtConfig();
  renderCustomFmtList();
  renderDateFormatList();
  renderReverse();
  toast(lang === 'zh' ? '格式已重置' : 'Formats reset');
}
function initDateFormatConfig() {
  if (btnCustomFmtAdd) {
    btnCustomFmtAdd.addEventListener('click', addCustomFormat);
    const labelEl = $('#custom-fmt-label');
    const inputEl = $('#custom-fmt-input');
    if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomFormat(); });
    if (labelEl) labelEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomFormat(); });
  }
  const searchEl = $('#date-fmt-search');
  if (searchEl) searchEl.addEventListener('input', () => renderDateFormatList());
  if (btnResetFmtConfig) btnResetFmtConfig.addEventListener('click', resetDateFormats);
  renderCustomFmtList();
}




function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  tsInput.placeholder = '';
  msInputEl.style.display = tab === 'ms' ? '' : 'none';
  toggleNowPanel();
  if (calendarEl.classList.contains('open')) renderTimeWheels();
  renderConvert();
  renderReverse();
}

function toggleNowPanel() {
  const secItem = $('#now-sec-item');
  const msItem = $('#now-ms-item');
  const showSec = currentTab === 'sec';
  if (secItem) secItem.style.display = showSec ? '' : 'none';
  if (msItem) msItem.style.display = showSec ? 'none' : '';
}

async function initTimestampInput() {
  let text = '';
  try {
    const nc = typeof navigator !== 'undefined' ? navigator.clipboard : null;
    if (nc && nc.readText) text = ((await nc.readText()) || '').trim();
  } catch (e) { text = ''; }
  if (/^-?\d+$/.test(text)) {
    tsInput.value = text;
  } else {
    tsInput.value = '';
  }
  renderReverse();
}

function currentOffsetStr(tz) {
  const mins = offsetMinutes(new Date(), tz);
  if (mins === 0) return '+00:00';
  const sign = mins > 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

// 创建时区偏移选项
function createTzOffsetOptions() {
  const offsets = new Set();
  TIMEZONES.forEach(tz => {
    if (tz.value && tz.value !== 'UTC' && tz.value !== '') {
      const mins = offsetMinutes(new Date(), tz.value);
      const offsetStr = currentOffsetStr(tz.value);
      offsets.add(offsetStr);
    }
  });
  
  return Array.from(offsets).sort((a, b) => {
    const aMin = parseInt(a.replace(/[+:-]/g, ''));
    const bMin = parseInt(b.replace(/[+:-]/g, ''));
    return aMin - bMin;
  });
}

// 基于现有滚轮实现的时区选择器
// 基于现有滚轮实现的时区选择器
function initCustomTzSelector() {
  console.log('开始初始化双滚轮时区选择器...');
  
  // 获取DOM元素
  const hourWheel = $('#tz-hour-wheel');
  const minWheel = $('#tz-min-wheel');
  const inputTz = $('#input-tz');
  const resetBtn = $('#tz-reset-btn');
  
  // 确保全局时区选择器有默认值
  if (timezoneEl && !timezoneEl.value) {
    console.log('全局时区选择器为空，设置默认值为 Asia/Shanghai');
    timezoneEl.value = 'Asia/Shanghai';
  }
  
  // 确保输入时区选择器与全局时区选择器同步
  if (inputTz && timezoneEl && inputTz.value !== timezoneEl.value) {
    console.log('同步输入时区选择器与全局时区选择器:', timezoneEl.value);
    inputTz.value = timezoneEl.value;
  }
  
  if (!hourWheel || !minWheel || !inputTz) {
    console.error('双滚轮时区选择器元素未找到');
    return;
  }
  
  // 小时数据 - 改为 +08 格式
  const hours = [
    '-12', '-11', '-10', '-09', '-08', '-07', '-06', '-05', '-04', '-03', '-02', '-01', 
    '+00', '+01', '+02', '+03', '+04', '+05', '+06', '+07', '+08', '+09', '+10', '+11', '+12', '+13', '+14'
  ];
  
  // 分钟数据
  const minutes = ['00', '15', '30', '45'];
  
    // 构建小时滚轮
    function buildHourWheel() {
      console.log('构建小时滚轮...');
      console.log('hourWheel 容器信息:', {
        offsetHeight: hourWheel.offsetHeight,
        clientHeight: hourWheel.clientHeight,
        scrollHeight: hourWheel.scrollHeight,
        paddingTop: hourWheel.style.paddingTop,
        paddingBottom: hourWheel.style.paddingBottom,
        borderTop: hourWheel.style.borderTop,
        borderBottom: hourWheel.style.borderBottom
      });
      
      hourWheel.innerHTML = '';
      hourWheel.style.paddingTop = '3px';
      hourWheel.style.paddingBottom = '3px';
      hourWheel._step = 34;
      
      for (let i = 0; i < hours.length; i++) {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        item.textContent = hours[i];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectWheelValue(hourWheel, i, (selectedIndex) => {
            updateHourFromWheel(hours[selectedIndex]);
          });
        });
        hourWheel.appendChild(item);
      }
    
    console.log('构建完成后 hourWheel:', {
      offsetHeight: hourWheel.offsetHeight,
      clientHeight: hourWheel.clientHeight,
      scrollHeight: hourWheel.scrollHeight,
      childrenCount: hourWheel.children.length,
      computedStyle: getComputedStyle(hourWheel)
    });
    
    // 打印第一个 wheel-item 的信息
    if (hourWheel.children.length > 1) { // 第一个是 hint
      const firstItem = hourWheel.children[1];
      console.log('第一个 wheel-item:', {
        offsetHeight: firstItem.offsetHeight,
        clientHeight: firstItem.clientHeight,
        scrollHeight: firstItem.scrollHeight,
        height: firstItem.style.height,
        lineHeight: firstItem.style.lineHeight,
        paddingTop: firstItem.style.paddingTop,
        paddingBottom: firstItem.style.paddingBottom,
        borderTop: firstItem.style.borderTop,
        borderBottom: firstItem.style.borderBottom
      });
    }
    
    // 设置初始选中值 - 默认使用全局时区
    console.log('=== 小时滚轮初始化开始 ===');
    console.log('inputTz.value:', inputTz.value);
    console.log('timezoneEl.value:', timezoneEl.value);
    console.log('inputTz元素:', inputTz);
    console.log('timezoneEl元素:', timezoneEl);
    
    const currentTz = inputTz.value || timezoneEl.value || 'UTC';
    console.log('最终使用的时区:', currentTz);
    console.log('时区元素是否存在:', !!timezoneEl);
    console.log('时区元素值类型:', typeof timezoneEl.value);
    
    try {
      console.log('开始计算offsetMinutes...');
      const mins = offsetMinutes(new Date(), currentTz);
      console.log('offsetMinutes结果:', mins);
      
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      console.log('计算的小时值:', hour);
      
      // 将小时转换为 +08 格式
      const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
      console.log('格式化的小时字符串:', hourStr);
      
      const hourIndex = hours.indexOf(hourStr);
      console.log('在hours数组中的索引:', hourIndex);
      console.log('hours数组:', hours);
      
      if (hourIndex >= 0) {
        console.log('设置小时滚轮选中索引:', hourIndex);
        selectWheelValue(hourWheel, hourIndex, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      } else {
        // 如果计算失败，默认选择UTC (+00)
        console.log('小时偏移计算失败，使用默认UTC (索引12)');
        selectWheelValue(hourWheel, 12, (selectedIndex) => {
          updateHourFromWheel(hours[selectedIndex]);
        });
      }
    } catch (error) {
      console.error('计算小时偏移时出错:', error);
      // 默认选择UTC (+00)
      console.log('捕获异常，使用默认UTC (索引12)');
      selectWheelValue(hourWheel, 12, (selectedIndex) => {
        updateHourFromWheel(hours[selectedIndex]);
      });
    }
    console.log('=== 小时滚轮初始化结束 ===');
    
    // 添加滚轮事件 - 实现真正的循环滚动
    hourWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      
      console.log('=== 小时滚轮滚轮事件触发 ===');
      console.log('滚动方向:', dir > 0 ? '向下' : '向上');
      console.log('当前选中索引:', hourWheel._sel);
      console.log('当前滚动位置:', hourWheel.scrollTop);
      console.log('滚轮事件deltaY:', e.deltaY);
      
      // 计算新的索引
      let ni = hourWheel._sel + dir;
      console.log('计算后的新索引:', ni);
      
      // 处理循环逻辑
      if (ni < 0) {
        // 向上循环：从-12跳到+12
        ni = hours.length - 1; // 24 = +12
        console.log('向上循环: -12 -> +12');
      } else if (ni >= hours.length) {
        // 向下循环：从+12跳到-12
        ni = 0; // 0 = -12
        console.log('向下循环: +12 -> -12');
      }
      
      console.log('最终索引:', ni);
      
      if (ni === hourWheel._sel) {
        console.log('索引未变化，取消滚动');
        return;
      }
      
      // 强制设置滚动位置到目标
      const targetScrollTop = ni * 34;
      console.log('目标滚动位置:', targetScrollTop);
      
      // 立即设置滚动位置
      hourWheel.scrollTop = targetScrollTop;
      
      // 立即设置选中状态
      hourWheel._sel = ni;
      highlightWheel(hourWheel, ni);
      
      // 滚动锁定
      hourWheel._suspend = true;
      
      // 验证滚动设置
      setTimeout(() => {
        console.log('验证滚动位置:', hourWheel.scrollTop, '期望:', targetScrollTop);
        if (hourWheel.scrollTop !== targetScrollTop) {
          console.log('滚动设置失败，强制调整');
          hourWheel.scrollTop = targetScrollTop;
        }
        hourWheel._suspend = false;
        console.log('小时滚轮滚动锁定解除');
      }, 50);
      
      // 更新时区
      updateHourFromWheel(hours[ni]);
      console.log('=== 小时滚轮处理完成 ===');
    }, { passive: false });
    
    // 恢复原有的滚动监听器
    hourWheel.addEventListener('scroll', () => {
      if (hourWheel._suspend) {
        console.log('小时滚轮滚动被锁定，忽略滚动事件');
        return;
      }
      
      const idx = wheelIndexFromScrollTop(hourWheel);
      console.log('=== 小时滚轮滚动事件 ===');
      console.log('滚动位置:', hourWheel.scrollTop);
      console.log('计算出的索引:', idx);
      console.log('当前选中索引:', hourWheel._sel);
      
      if (idx !== hourWheel._sel) { 
        console.log('索引变化，更新选中状态');
        hourWheel._sel = idx; 
        highlightWheel(hourWheel, idx); 
        updateHourFromWheel(hours[idx]); 
      } else {
        console.log('索引未变化，保持当前状态');
      }
    });
  }
  
    // 构建分钟滚轮
    function buildMinWheel() {
      console.log('构建分钟滚轮...');
      console.log('minWheel 容器信息:', {
        offsetHeight: minWheel.offsetHeight,
        clientHeight: minWheel.clientHeight,
        scrollHeight: minWheel.scrollHeight,
        paddingTop: minWheel.style.paddingTop,
        paddingBottom: minWheel.style.paddingBottom,
        borderTop: minWheel.style.borderTop,
        borderBottom: minWheel.style.borderBottom
      });
      
      minWheel.innerHTML = '';
      minWheel.style.paddingTop = '3px';
      minWheel.style.paddingBottom = '3px';
      minWheel._step = 34;
      
      for (let i = 0; i < minutes.length; i++) {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        item.textContent = minutes[i];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectWheelValue(minWheel, i, (selectedIndex) => {
            updateMinFromWheel(minutes[selectedIndex]);
          });
        });
        minWheel.appendChild(item);
      }
    
      console.log('构建完成后 minWheel:', {
        offsetHeight: minWheel.offsetHeight,
        clientHeight: minWheel.clientHeight,
        scrollHeight: minWheel.scrollHeight,
        childrenCount: minWheel.children.length,
        computedStyle: getComputedStyle(minWheel)
      });
    
    // 打印第一个 wheel-item 的信息
    if (minWheel.children.length > 1) { // 第一个是 hint
      const firstItem = minWheel.children[1];
      console.log('第一个 wheel-item:', {
        offsetHeight: firstItem.offsetHeight,
        clientHeight: firstItem.clientHeight,
        scrollHeight: firstItem.scrollHeight,
        height: firstItem.style.height,
        lineHeight: firstItem.style.lineHeight,
        paddingTop: firstItem.style.paddingTop,
        paddingBottom: firstItem.style.paddingBottom,
        borderTop: firstItem.style.borderTop,
        borderBottom: firstItem.style.borderBottom
      });
    }
    
    // 设置初始选中值 - 默认使用全局时区
    console.log('=== 分钟滚轮初始化开始 ===');
    console.log('inputTz.value:', inputTz.value);
    console.log('timezoneEl.value:', timezoneEl.value);
    
    const currentTz = inputTz.value || timezoneEl.value || 'UTC';
    console.log('最终使用的时区:', currentTz);
    
    try {
      console.log('开始计算offsetMinutes...');
      const mins = offsetMinutes(new Date(), currentTz);
      console.log('offsetMinutes结果:', mins);
      
      const min = (mins % 60);
      console.log('计算的分钟值:', min);
      
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
      });
      console.log('最接近的分钟值:', closestMin);
      
      const minIndex = minutes.indexOf(closestMin);
      console.log('在minutes数组中的索引:', minIndex);
      console.log('minutes数组:', minutes);
      
      if (minIndex >= 0) {
        console.log('设置分钟滚轮选中索引:', minIndex);
        selectWheelValue(minWheel, minIndex, (selectedIndex) => {
          updateMinFromWheel(minutes[selectedIndex]);
        });
      } else {
        // 如果计算失败，默认选择00
        console.log('分钟偏移计算失败，使用默认00 (索引0)');
        selectWheelValue(minWheel, 0, (selectedIndex) => {
          updateMinFromWheel(minutes[selectedIndex]);
        });
      }
    } catch (error) {
      console.error('计算分钟偏移时出错:', error);
      // 默认选择00
      console.log('捕获异常，使用默认00 (索引0)');
      selectWheelValue(minWheel, 0, (selectedIndex) => {
        updateMinFromWheel(minutes[selectedIndex]);
      });
    }
    console.log('=== 分钟滚轮初始化结束 ===');
    
    // 添加滚轮事件 - 实现真正的循环滚动
    minWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      
      console.log('=== 分钟滚轮滚轮事件触发 ===');
      console.log('滚动方向:', dir > 0 ? '向下' : '向上');
      console.log('当前选中索引:', minWheel._sel);
      console.log('当前滚动位置:', minWheel.scrollTop);
      console.log('滚轮事件deltaY:', e.deltaY);
      
      // 计算新的索引
      let ni = minWheel._sel + dir;
      console.log('计算后的新索引:', ni);
      
      // 处理循环逻辑
      if (ni < 0) {
        // 向上循环：从00跳到45
        ni = minutes.length - 1; // 3 = 45
        console.log('向上循环: 00 -> 45');
      } else if (ni >= minutes.length) {
        // 向下循环：从45跳到00
        ni = 0; // 0 = 00
        console.log('向下循环: 45 -> 00');
      }
      
      console.log('最终索引:', ni);
      
      if (ni === minWheel._sel) {
        console.log('索引未变化，取消滚动');
        return;
      }
      
      // 强制设置滚动位置到目标
      const targetScrollTop = ni * 34;
      console.log('目标滚动位置:', targetScrollTop);
      
      // 立即设置滚动位置
      minWheel.scrollTop = targetScrollTop;
      
      // 立即设置选中状态
      minWheel._sel = ni;
      highlightWheel(minWheel, ni);
      
      // 滚动锁定
      minWheel._suspend = true;
      
      // 验证滚动设置
      setTimeout(() => {
        console.log('验证滚动位置:', minWheel.scrollTop, '期望:', targetScrollTop);
        if (minWheel.scrollTop !== targetScrollTop) {
          console.log('滚动设置失败，强制调整');
          minWheel.scrollTop = targetScrollTop;
        }
        minWheel._suspend = false;
        console.log('分钟滚轮滚动锁定解除');
      }, 50);
      
      // 更新时区
      updateMinFromWheel(minutes[ni]);
      console.log('=== 分钟滚轮处理完成 ===');
    }, { passive: false });
    
    // 恢复原有的滚动监听器
    minWheel.addEventListener('scroll', () => {
      if (minWheel._suspend) {
        console.log('分钟滚轮滚动被锁定，忽略滚动事件');
        return;
      }
      
      const idx = wheelIndexFromScrollTop(minWheel);
      console.log('=== 分钟滚轮滚动事件 ===');
      console.log('滚动位置:', minWheel.scrollTop);
      console.log('计算出的索引:', idx);
      console.log('当前选中索引:', minWheel._sel);
      
      if (idx !== minWheel._sel) { 
        console.log('索引变化，更新选中状态');
        minWheel._sel = idx; 
        highlightWheel(minWheel, idx); 
        updateMinFromWheel(minutes[idx]); 
      } else {
        console.log('索引未变化，保持当前状态');
      }
    });
  }
  
  // 从小时滚轮更新时区
  function updateHourFromWheel(hourStr) {
    // 解析小时字符串，如 "+08" -> 8
    const hour = parseInt(hourStr);
    const matchingTz = TIMEZONES.find(tz => {
      if (!tz.value || tz.value === 'UTC' || tz.value === '') return false;
      const tzMins = offsetMinutes(new Date(), tz.value);
      const tzHour = Math.floor(Math.abs(tzMins) / 60) * (tzMins >= 0 ? 1 : -1);
      return tzHour === hour;
    });
    
    if (matchingTz) {
      inputTz.value = matchingTz.value;
      renderConvert();
    }
  }
  
  // 从分钟滚轮更新时区
  function updateMinFromWheel(min) {
    const matchingTz = TIMEZONES.find(tz => {
      if (!tz.value || tz.value === 'UTC' || tz.value === '') return false;
      const tzMins = offsetMinutes(new Date(), tz.value);
      const tzMin = (tzMins % 60);
      return Math.abs(tzMin - parseInt(min)) <= 15;
    });
    
    if (matchingTz) {
      inputTz.value = matchingTz.value;
      renderConvert();
    }
  }
  
  // 重置功能
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const globalTz = timezoneEl.value || 'UTC';
      inputTz.value = globalTz;
      console.log('重置到全局时区:', globalTz);
      
      // 重置时间校准
      timeOffset = 0;
      lastUpdateTime = 0;
      updateNow();
      
      try {
        // 重新构建滚轮以反映新的时区
        const mins = offsetMinutes(new Date(), globalTz);
        const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
        const min = (Math.abs(mins) % 60);
        
        // 将小时转换为 +08 格式
        const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
        const hourIndex = hours.indexOf(hourStr);
        const closestMin = minutes.reduce((prev, curr) => {
          return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
        });
        const minIndex = minutes.indexOf(closestMin);
        
        console.log('重置后滚轮值:', { hour, hourStr, hourIndex, min, closestMin, minIndex });
        
        if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
        if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
      } catch (error) {
        console.error('重置滚轮时出错:', error);
        // 出错时重置到UTC
        selectWheelValue(hourWheel, 12); // +00 = UTC
        selectWheelValue(minWheel, 0);   // 00
      }
      
      renderConvert();
      toast(lang === 'zh' ? '已重置为全局时区' : 'Reset to global timezone');
    });
  }
  
  // 监听原始选择器变化
  inputTz.addEventListener('change', () => {
    const targetTz = inputTz.value || timezoneEl.value || 'UTC';
    console.log('时区选择器变化，目标时区:', targetTz);
    
    try {
      const mins = offsetMinutes(new Date(), targetTz);
      const hour = Math.floor(Math.abs(mins) / 60) * (mins >= 0 ? 1 : -1);
      const min = (Math.abs(mins) % 60);
      
      // 将小时转换为 +08 格式
      const hourStr = hour >= 0 ? '+' + hour.toString().padStart(2, '0') : hour.toString();
      const hourIndex = hours.indexOf(hourStr);
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev;
      });
      const minIndex = minutes.indexOf(closestMin);
      
      console.log('更新滚轮:', { hour, hourStr, hourIndex, min, closestMin, minIndex });
      
      if (hourIndex >= 0) selectWheelValue(hourWheel, hourIndex);
      if (minIndex >= 0) selectWheelValue(minWheel, minIndex);
    } catch (error) {
      console.error('更新滚轮时出错:', error);
      // 出错时重置到UTC
      selectWheelValue(hourWheel, 12); // +00 = UTC
      selectWheelValue(minWheel, 0);   // 00
    }
  });
  
  // 初始化滚轮
  console.log('=== 开始构建时区滚轮 ===');
  console.log('当前DOM状态:');
  console.log('hourWheel存在:', !!hourWheel);
  console.log('minWheel存在:', !!minWheel);
  console.log('inputTz存在:', !!inputTz);
  console.log('timezoneEl存在:', !!timezoneEl);
  
  buildHourWheel();
  buildMinWheel();
  
  console.log('=== 时区滚轮构建完成 ===');
  
  console.log('双滚轮时区选择器初始化完成');
}

function applyLang() {
  btnLang.textContent = lang === 'zh' ? 'EN' : '中';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  
  // 按UTC偏移量排序时区
  const sortedTimezones = [...TIMEZONES].sort((a, b) => {
    if (a.value === '') return -1; // 本地时区排在最前
    if (b.value === '') return 1;
    if (a.value === 'UTC') return -1; // UTC排在本地时区之后
    if (b.value === 'UTC') return 1;
    
    const offsetA = offsetMinutes(new Date(), a.value);
    const offsetB = offsetMinutes(new Date(), b.value);
    return offsetA - offsetB;
  });
  
  const off = (v) => currentOffsetStr(v);
  const cityOf = (z) => lang === 'zh' ? z.label.split(/[／（( ]/)[0] : z.labelEn;
  timezoneEl.innerHTML = sortedTimezones.map((z) => {
    if (z.value === '') return `<option value="">${lang === 'zh' ? '本地' : 'Local'} ${off('')}</option>`;
    if (z.value === 'UTC') return `<option value="UTC">UTC</option>`;
    const abbr = zoneAliases(z).slice(0, 1).join('');
    return `<option value="${z.value}">${cityOf(z)}${abbr ? ` (${abbr})` : ''} ${off(z.value)}</option>`;
  }).join('');
  
  // 确保全局时区选择器有默认值
  if (!timezoneEl.value) {
    console.log('applyLang: 全局时区选择器为空，设置默认值为 Asia/Shanghai');
    timezoneEl.value = 'Asia/Shanghai';
  }
  
  inputTzEl.innerHTML = sortedTimezones.map((z) => {
    if (z.value === '') return `<option value="" title="${lang === 'zh' ? '本地时区' : 'Local time'}">${lang === 'zh' ? '本地时区' : 'Local'} ${off('')}</option>`;
    if (z.value === 'UTC') return `<option value="UTC" title="UTC 协调世界时">UTC ${off('UTC')}</option>`;
    const abbr = zoneAliases(z).slice(0, 1).join('');
    return `<option value="${z.value}" title="${lang === 'zh' ? z.label : z.labelEn}${abbr ? ` (${abbr})` : ''}">${lang === 'zh' ? `${z.label}${abbr ? ` (${abbr})` : ''} ${off(z.value)}` : `${z.labelEn}${abbr ? ` (${abbr})` : ''} ${off(z.value)}`}</option>`;
  }).join('');
  inputTzEl.title = lang === 'zh' ? '输入时区：日期按此时区解析' : 'Input timezone: dates parsed in this zone';
  if (inputTzEl.value !== timezoneEl.value) inputTzEl.value = timezoneEl.value;
  btnPause.textContent = paused ? t('resume') : t('pause');
  tsInput.placeholder = '';
  dateInput.placeholder = t('datePlaceholder');
  timeInputEl.placeholder = t('timePlaceholder');
  msInputEl.placeholder = t('msPlaceholder');
  msInputEl.style.display = currentTab === 'ms' ? '' : 'none';
  if (tzSearchEl) tzSearchEl.placeholder = t('tzSearchPlaceholder');
  $('#cal-now').textContent = t('now');
  $('#cal-ok').textContent = t('ok');
  const weekNames = lang === 'zh'
    ? { Su: '日', Mo: '一', Tu: '二', We: '三', Th: '四', Fr: '五', Sa: '六' }
    : { Su: 'Su', Mo: 'Mo', Tu: 'Tu', We: 'We', Th: 'Th', Fr: 'Fr', Sa: 'Sa' };
  document.querySelectorAll('.cal-week span').forEach((el) => { el.textContent = weekNames[el.dataset.w] || el.textContent; });
  renderCalendar();
}

function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); renderConvert(); renderReverse(); }

timezoneEl.addEventListener('change', () => { 
  inputTzEl.value = timezoneEl.value; 
  renderConvert(); 
  renderReverse(); 
  // 时区变化时重新校准时间
  timeOffset = 0;
  lastUpdateTime = 0;
  updateNow(); 
  renderCalendar(); 
});
inputTzEl.addEventListener('change', () => { renderConvert(); });
dateInput.addEventListener('input', () => { renderConvert(); showSuggestions(); });
dateInput.addEventListener('focus', () => { calendarEl.classList.remove('open'); showSuggestions(); });
dateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { renderConvert(); hideSuggestions(); calendarEl.classList.remove('open'); }
  if (e.key === 'Escape') { hideSuggestions(); calendarEl.classList.remove('open'); if (window.utools) utools.outPlugin(); }
});
timeInputEl.addEventListener('input', renderConvert);
timeInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
msInputEl.addEventListener('input', renderConvert);
msInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && window.utools) utools.outPlugin(); });
tsInput.addEventListener('input', renderReverse);
tsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderReverse(); if (e.key === 'Escape' && window.utools) utools.outPlugin(); });

$('#btn-calendar').addEventListener('click', () => {
  if (calendarEl.classList.contains('open')) closeCalendar();
  else openCalendar();
});
$('#cal-prev').addEventListener('click', (e) => { e.stopPropagation(); calNavigate(-1); });
$('#cal-next').addEventListener('click', (e) => { e.stopPropagation(); calNavigate(1); });
$('#cal-title').addEventListener('click', (e) => {
  e.stopPropagation();
  if (calView === 'day') showMonthView();
  else if (calView === 'month') showYearView();
  else { calView = 'day'; renderCalendar(); }
});
$('#cal-year-input').addEventListener('input', followYearInput);
$('#cal-year-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToYearInput(); } if (e.key === 'Escape') closeCalendar(); });
$('#cal-year-input').addEventListener('focus', () => calYearInputEl.classList.remove('err-jump'));
calTimeInputEl.addEventListener('input', followTimeInput);
calTimeInputEl.addEventListener('focus', syncTimeInput);
calTimeInputEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCalendar(); });
calendarEl.addEventListener('click', (e) => {
  const z = e.target.closest('.wheel-zero');
  if (!z) return;
  e.stopPropagation();
  const k = z.dataset.wheel;
  const map = { hh: 'hh', mm: 'mm', ss: 'ss', ms: 'ms' };
  if (!map[k]) return;
  calTime[map[k]] = 0;
  renderTimeWheels();
  applyWheelTime();
});
calYearHeadEl.addEventListener('click', (e) => {
  const navBtn = e.target.closest('button');
  if (navBtn && navBtn.dataset.step) {
    e.stopPropagation();
    e.preventDefault();
    calDecadeStart += +navBtn.dataset.step;
    renderCalendar();
  }
});
$('#cal-now').addEventListener('click', (e) => {
  e.stopPropagation();
  const n = new Date();
  calSelected = { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate() };
  calYear = n.getFullYear(); calMonth = n.getMonth();
  calTime.hh = n.getHours(); calTime.mm = n.getMinutes(); calTime.ss = n.getSeconds(); calTime.ms = n.getMilliseconds();
  setDateFields(calYear, calMonth + 1, calSelected.d, calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  renderTimeWheels();
  renderCalendar(); renderConvert();
});
$('#cal-ok').addEventListener('click', (e) => {
  e.stopPropagation();
  if (calSelected) {
    setDateFields(calSelected.y, calSelected.mo + 1, calSelected.d,
      calTime.hh, calTime.mm, calTime.ss, calTime.ms);
  }
  renderConvert();
  closeCalendar();
});

dateSuggestEl.addEventListener('click', (e) => {
  const item = e.target.closest('.sg-item');
  if (!item) return;
  applyFullDateStr(item.dataset.date);
  hideSuggestions();
  if (item.dataset.month) {
    const [y, mo0] = item.dataset.month.split('-').map(Number);
    calSelected = { y, mo: mo0, d: parseInt(item.dataset.date.slice(8, 10)) };
    setCalendarMonth(y, mo0);
    openCalendar();
    return;
  }
  renderConvert();
});

document.addEventListener('click', (e) => {
  if (!dateFieldEl.contains(e.target)) {
    hideSuggestions();
    closeCalendar();
  }
});

btnLang.addEventListener('click', toggleLang);
document.querySelectorAll('.tab').forEach((el) => el.addEventListener('click', () => switchTab(el.dataset.tab)));

btnPause.addEventListener('click', () => {
  paused = !paused;
  liveDot.classList.toggle('paused', paused);
  btnPause.textContent = paused ? t('resume') : t('pause');
  if (!paused) updateNow();
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.t2d-popover')) return;
  const block = e.target.closest('.result-block');
  if (block) {
    const val = block.querySelector('.result-value');
    if (val && val.dataset.value) copyText(val.dataset.value, null);
    return;
  }
  const item = e.target.closest('.now-item.clickable');
  if (item) { copyText(item.querySelector('.now-value').textContent, null); return; }
});

let popoverHideTimer = null;
function hideT2dPopover() {
  clearTimeout(popoverHideTimer);
  t2dResultEl.classList.remove('show-popover');
}
t2dResultEl.addEventListener('mouseenter', () => {
  clearTimeout(popoverHideTimer);
  if (currentT2dMs() === null) return;
  renderT2dPopover();
  t2dResultEl.classList.add('show-popover');
});
t2dResultEl.addEventListener('mouseleave', () => {
  clearTimeout(popoverHideTimer);
  popoverHideTimer = setTimeout(() => t2dResultEl.classList.remove('show-popover'), 180);
});
t2dPopoverEl.addEventListener('mouseenter', () => {
  clearTimeout(popoverHideTimer);
});
t2dPopoverEl.addEventListener('click', (e) => {
  const item = e.target.closest('.t2d-pop-item');
  if (!item) return;
  copyText(item.dataset.value, null);
  hideT2dPopover();
});

const buildTagEl = $('#build-tag');
if (buildTagEl) buildTagEl.textContent = BUILD;

// 自定义滚动条：隐藏原生白条，使用自绘深色滚动条（兼容 utools WebView 等不识别 -webkit-scrollbar 的环境）
const csbList = [];
function setupCsb(scrollEl) {
  if (!scrollEl || scrollEl.__csb) return;
  scrollEl.__csb = true;
  const track = document.createElement('div');
  track.className = 'csb';
  track.innerHTML = '<div class="csb-thumb"></div>';
  // 轨道作为容器第一个子元素，用 position:sticky 钉在滚动视口顶部（不随内容滚动，各引擎通用）
  scrollEl.insertBefore(track, scrollEl.firstChild);
  const thumb = track.firstElementChild;
  const csb = { el: scrollEl, track, thumb, last: '' };
  csbList.push(csb);
  const sync = () => {
    const contentH = scrollEl.scrollHeight, viewH = scrollEl.clientHeight;
    const scrollTop = scrollEl.scrollTop;
    const key = contentH + '|' + viewH + '|' + Math.round(scrollTop / 2);
    if (key === csb.last) return;
    csb.last = key;
    if (contentH <= viewH + 1 || viewH <= 0) {
      track.classList.remove('show');
      thumb.style.height = '0px';
      thumb.style.top = '0px';
      return;
    }
    track.classList.add('show');
    const trackH = Math.max(20, viewH - 4);
    const thumbH = Math.max(20, trackH * viewH / contentH);
    const maxScroll = contentH - viewH;
    thumb.style.height = thumbH + 'px';
    const maxTop = Math.max(0, trackH - thumbH);
    thumb.style.top = (maxScroll > 0 ? Math.min(maxTop, trackH * scrollTop / maxScroll) : 0) + 'px';
  };
  csb.sync = sync;
  scrollEl.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  let dragging = null;
  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = { startY: e.clientY, startTop: scrollEl.scrollTop };
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    if (maxScroll <= 0) return;
    const trackH = Math.max(20, scrollEl.clientHeight - 4);
    const thumbH = Math.max(20, thumb.offsetHeight);
    const ratio = (e.clientY - dragging.startY) / ((trackH - thumbH) || 1);
    scrollEl.scrollTop = dragging.startTop + ratio * maxScroll;
  });
  document.addEventListener('mouseup', () => { dragging = null; });
  new MutationObserver(() => requestAnimationFrame(sync)).observe(scrollEl, { childList: true, subtree: true });
  sync();
}
function initCsb() {
  document.querySelectorAll('.timezone-list-container, .modal-body, .main-grid').forEach(setupCsb);
  document.querySelectorAll('.modal').forEach((m) => {
    new MutationObserver(() => {
      for (const c of csbList) c.last = '';
      requestAnimationFrame(() => csbList.forEach((c) => { c.last = ''; c.sync(); }));
    }).observe(m, { attributes: true, attributeFilter: ['class'] });
  });
}

initTzConfig();
renderDateFormatList();
applyLang();
switchTab('sec');
updateNow();
initTimestampInput();
initCsb();

if (window.utools) {
  utools.onPluginEnter(({ payload }) => {
    const p = payload && payload.trim();
    if (!p) { initTimestampInput(); tsInput.focus(); return; }
    if (/^\d{13}$/.test(p)) { switchTab('ms'); tsInput.value = p; renderReverse(); }
    else if (/^\d{10}$/.test(p)) { switchTab('sec'); tsInput.value = p; renderReverse(); }
    else if (parseDate(p)) { applyFullDateStr(p); timeInputEl.focus(); renderConvert(); }
    else { initTimestampInput(); }
    tsInput.focus();
  });
  try { utools.setExpendHeight(560); } catch (e) {}
  
  // 延迟初始化双滚轮时区选择器，避免阻塞
  setTimeout(() => {
    try {
      console.log('准备调用initCustomTzSelector...');
      initCustomTzSelector();
    } catch (error) {
      console.error('初始化双滚轮时区选择器失败:', error);
    }
  }, 100);
}

// 每50ms更新一次，实现更流畅的毫秒滚动效果
setInterval(updateNow, 50);
