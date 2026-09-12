import os
import json

def process_metro_data(input_file, metro_id, metro_name):
    print(f"Loading {metro_name} from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    # 1. Special zones lookup
    special_zones_by_corridor = {}
    special_zones_list = []
    for sz in raw.get('special_zones', []):
        z_info = {
            'zone_id': sz.get('zone_id'),
            'name': sz.get('name'),
            'zone_type': sz.get('zone_type'),
            'note': sz.get('note', ''),
            'host_corridor_ids': sz.get('host_corridor_ids', [])
        }
        special_zones_list.append(z_info)
        for cid in sz.get('host_corridor_ids', []):
            if cid not in special_zones_by_corridor:
                special_zones_by_corridor[cid] = []
            special_zones_by_corridor[cid].append(z_info)

    # 2. Map context (points and centroids)
    points_by_corridor = {}
    centroids_by_corridor = {}
    for entry in raw.get('map', {}).get('corridor_context', []):
        cid = entry.get('corridor_id')
        pts = entry.get('points', [])
        clean_pts = []
        lats = []
        lons = []
        for p in pts:
            lat = p.get('lat')
            lon = p.get('lon')
            if lat is not None and lon is not None:
                lats.append(lat)
                lons.append(lon)
            clean_pts.append({
                'name': p.get('name'),
                'category': p.get('category'),
                'family': p.get('family'),
                'family_label': p.get('family_label'),
                'lat': lat,
                'lon': lon,
                'placekey': p.get('placekey')
            })
        points_by_corridor[cid] = clean_pts
        if lats and lons:
            centroids_by_corridor[cid] = {
                'lat': round(sum(lats) / len(lats), 6),
                'lon': round(sum(lons) / len(lons), 6)
            }

    # 3. Audience segments lookup
    segments_catalog = {}
    for seg in raw.get('audience_segments', []):
        segments_catalog[seg.get('segment_id')] = {
            'segment_id': seg.get('segment_id'),
            'label': seg.get('label'),
            'family_id': seg.get('family_id'),
            'definition': seg.get('definition', '')
        }

    # 4. Archetypes catalog
    archetypes_catalog = []
    for a in raw.get('archetypes', []):
        archetypes_catalog.append({
            'archetype_id': a.get('archetype_id'),
            'name': a.get('name'),
            'category_id': a.get('category_id'),
            'number': a.get('number'),
            'mission': a.get('mission'),
            'required_gate': a.get('required_gate'),
            'primary_signals': a.get('primary_signals', []),
            'supporting_signals': a.get('supporting_signals', []),
            'context_only_signals': a.get('context_only_signals', []),
            'prohibited_substitutions': a.get('prohibited_substitutions', [])
        })

    # 5. Fit scores indexed by corridor_id and archetype_id
    scores_by_corridor = {}
    for sc in raw.get('corridor_archetype_scores', []):
        cid = sc.get('corridor_id')
        aid = sc.get('archetype_id')
        if cid not in scores_by_corridor:
            scores_by_corridor[cid] = {}
        
        score_val = sc.get('score', 0)
        # Normalize score to 4 decimal places
        if score_val is not None:
            score_val = round(float(score_val), 4)

        scores_by_corridor[cid][aid] = {
            'score': score_val,
            'tier': sc.get('tier', 'UNKNOWN'),
            'score_kind': sc.get('score_kind'),
            'audience_index': sc.get('audience_index'),
            'timing_index': sc.get('timing_index'),
            'screening_eligible': sc.get('screening_eligible', False),
            'reasons': sc.get('reasons', []),
            'contributions': sc.get('contributions', [])
        }

    # 6. Corridors
    clean_corridors = []
    for c in raw.get('corridors', []):
        cid = c.get('corridor_id')
        
        # Determine district/borough name
        borough = c.get('borough') or c.get('district') or 'General'
        
        # Places info
        places_obj = c.get('places') or {}
        classes_obj = places_obj.get('classes') or {}
        cafe_info = classes_obj.get('CAFE') or {}
        cafe_count = cafe_info.get('listing_count', 0) if isinstance(cafe_info, dict) else 0

        # Places count by class
        place_classes_summary = {}
        if isinstance(classes_obj, dict):
            for cls_name, cls_data in classes_obj.items():
                if isinstance(cls_data, dict):
                    place_classes_summary[cls_name] = cls_data.get('listing_count', 0)

        # Whitespace
        behavior = c.get('behavior') or {}
        whitespace_obj = behavior.get('whitespace_quality') or {}
        cafe_whitespace = whitespace_obj.get('cafe', 0) if isinstance(whitespace_obj, dict) else 0

        # Top audience segments for this corridor
        aud_scores = c.get('audience_scores') or {}
        top_audiences = []
        if isinstance(aud_scores, dict):
            # Sort by score descending
            sorted_segs = sorted(aud_scores.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True)
            for seg_id, s_val in sorted_segs[:8]:
                seg_meta = segments_catalog.get(seg_id, {})
                top_audiences.append({
                    'segment_id': seg_id,
                    'label': seg_meta.get('label', seg_id),
                    'family_id': seg_meta.get('family_id', ''),
                    'score': s_val
                })

        # Anchors
        anchors_list = []
        for anc in (c.get('anchors') or []):
            if isinstance(anc, dict):
                anchors_list.append({
                    'name': anc.get('name'),
                    'class': anc.get('class'),
                    'relation': anc.get('relation')
                })

        # Fallback centroid if no points
        centroid = centroids_by_corridor.get(cid, None)
        pts = points_by_corridor.get(cid, [])
        if not centroid and pts:
            valid_pts = [p for p in pts if p.get('lat') and p.get('lon')]
            if valid_pts:
                centroid = {
                    'lat': round(sum(p['lat'] for p in valid_pts) / len(valid_pts), 6),
                    'lon': round(sum(p['lon'] for p in valid_pts) / len(valid_pts), 6)
                }

        # If still none, set metro defaults
        if not centroid:
            if metro_id == 'nyc':
                centroid = {'lat': 40.7128, 'lon': -74.0060}
            else:
                centroid = {'lat': 32.7767, 'lon': -96.7970}

        corridor_record = {
            'id': cid,
            'legacy_id': c.get('legacy_corridor_id'),
            'name': c.get('name'),
            'borough': borough,
            'neighborhoods': c.get('neighborhoods') or [],
            'character': c.get('character') or '',
            'dominant_audience': c.get('dominant_audience') or {},
            'cafe_whitespace': cafe_whitespace,
            'whitespace_all': whitespace_obj if isinstance(whitespace_obj, dict) else {},
            'cafe_count': cafe_count,
            'place_classes': place_classes_summary,
            'anchors': anchors_list,
            'demand_sources': c.get('demand_sources') or {},
            'spending_power': c.get('spending_power'),
            'data_quality': c.get('data_quality') or {},
            'special_zones': special_zones_by_corridor.get(cid, []),
            'centroid': centroid,
            'sample_points': pts[:40], # keep top 40 sampled places for map display
            'top_audiences': top_audiences,
            'scores': scores_by_corridor.get(cid, {})
        }
        clean_corridors.append(corridor_record)

    output_payload = {
        'metro_id': metro_id,
        'metro_name': metro_name,
        'corridors_count': len(clean_corridors),
        'archetypes_count': len(archetypes_catalog),
        'special_zones_count': len(special_zones_list),
        'geometry_note': (
            "DFW hexes represent an activity display envelope, not parcel boundaries or exact site catchments."
            if metro_id == 'dfw'
            else "Canonical, non-overlapping H3 corridor boundaries."
        ),
        'archetypes': archetypes_catalog,
        'special_zones': special_zones_list,
        'audience_segments': list(segments_catalog.values()),
        'corridors': clean_corridors
    }
    return output_payload

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    starter_kit_dir = os.path.join(base_dir, 'starter-kit', 'usa-corridors-20260906-r2')
    public_data_dir = os.path.join(base_dir, 'public', 'data')
    os.makedirs(public_data_dir, exist_ok=True)

    # 1. NYC
    nyc_path = os.path.join(starter_kit_dir, 'NYC_CORRIDORS.full.json')
    if os.path.exists(nyc_path):
        nyc_payload = process_metro_data(nyc_path, 'nyc', 'New York City')
        out_nyc = os.path.join(public_data_dir, 'nyc.json')
        with open(out_nyc, 'w', encoding='utf-8') as f:
            json.dump(nyc_payload, f, separators=(',', ':'))
        print(f"Saved {nyc_payload['corridors_count']} NYC corridors to {out_nyc} ({os.path.getsize(out_nyc) / 1024:.1f} KB)")
    else:
        print(f"Error: {nyc_path} not found!")

    # 2. DFW
    dfw_path = os.path.join(starter_kit_dir, 'DALLAS_FORT_WORTH_CORRIDORS.full.json')
    if os.path.exists(dfw_path):
        dfw_payload = process_metro_data(dfw_path, 'dfw', 'Dallas–Fort Worth')
        out_dfw = os.path.join(public_data_dir, 'dfw.json')
        with open(out_dfw, 'w', encoding='utf-8') as f:
            json.dump(dfw_payload, f, separators=(',', ':'))
        print(f"Saved {dfw_payload['corridors_count']} DFW corridors to {out_dfw} ({os.path.getsize(out_dfw) / 1024:.1f} KB)")
    else:
        print(f"Error: {dfw_path} not found!")

    print("\nData preparation complete! All authentic starter kit data indexed successfully.")

if __name__ == '__main__':
    main()
