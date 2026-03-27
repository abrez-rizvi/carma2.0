import re
import json

with open('../digital-twin-frontend/src/data/delhiWards.ts', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r'\{\s*"id":\s*\d+,\s*"name":\s*"([^"]+)",\s*"zone":\s*"([^"]+)"\s*\}', content)

ward_to_zone = {}
for m in matches:
    name = m.group(1).upper()
    zone_raw = m.group(2)
    
    valid_zones = ['narela', 'civil line', 'rohini', 'keshavpuram', 'city s.p.zone', 'karolbagh', 'west zone', 'najafgarh zone', 'central zone', 'south zone', 'shahdara north zone', 'shahdara south zone']
    matched_zone = 'Unknown'
    for vz in valid_zones:
        if vz.lower() in zone_raw.lower() or vz.lower().replace(' ', '') in zone_raw.lower().replace(' ', ''):
            matched_zone = vz.title() if vz != 'city s.p.zone' else 'City S.P. Zone'
            break
            
    ward_to_zone[name] = matched_zone

# Write to zone_mapper.py
with open('zone_mapper.py', 'w', encoding='utf-8') as f:
    f.write('WARD_TO_ZONE = ' + json.dumps(ward_to_zone, indent=4) + '\n\n')
    f.write('''
def get_zone_for_ward(ward_name):
    ward_name = str(ward_name).upper()
    # Try exact match
    if ward_name in WARD_TO_ZONE:
        return WARD_TO_ZONE[ward_name]
    # Try partial match
    for name, zone in WARD_TO_ZONE.items():
        if len(name) > 3 and name in ward_name:
            return zone
        if len(ward_name) > 3 and ward_name in name:
            return zone
    return 'Unknown Zone'
''')
print('Created zone_mapper.py with', len(ward_to_zone), 'wards')
