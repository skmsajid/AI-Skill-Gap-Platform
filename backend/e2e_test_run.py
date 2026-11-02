import os, json, time, sys
sys.path.insert(0, r'c:\Users\Sajid\Documents\Major Project\AI-Skill-Gap-Platform\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillgap_project.settings')
os.chdir(r'c:\Users\Sajid\Documents\Major Project\AI-Skill-Gap-Platform\backend')

import django
django.setup()

from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile

c = Client(enforce_csrf_checks=False)
results = []

def check(cond, label, detail=''):
    status = 'PASS' if cond else 'FAIL'
    print(f'  [{status}] {label}' + (f' ({detail})' if detail else ''))
    results.append((label, cond))
    if not cond:
        raise AssertionError(f'FAILED: {label}')

print('='*55)
print('SkillBridge Backend End-to-End Integration Test')
print('='*55)

print()
print('[1] CSRF Token')
r = c.get('/api/auth/csrf/')
check(r.status_code == 200, 'CSRF 200', f'{r.status_code}')

print()
print('[2] Register User')
ts = str(int(time.time()))[-6:]
uname = f'e2e_{ts}'
reg = c.post('/api/auth/register/', json.dumps({
    'username': uname, 'email': f'{uname}@test.com',
    'password': 'Password@123', 'confirm_password': 'Password@123',
    'first_name': 'Alex', 'last_name': 'Rivera',
    'target_role': 'Senior Backend Engineer', 'education': 'B.Tech CSE'
}), content_type='application/json')
check(reg.status_code == 201, 'Register 201', str(reg.status_code))
check(c.session.get('_auth_user_id') is not None, 'Auto-logged in')

print()
print('[3] Profile')
p = c.get('/api/auth/profile/')
check(p.status_code == 200, 'Profile GET 200')
check(p.json().get('username') == uname, 'Username matches')
check(p.json().get('first_name') == 'Alex', 'First name in profile')
upd = c.put('/api/auth/profile/', json.dumps({
    'target_role': 'Lead Python Architect', 'bio': 'Cloud dev.'
}), content_type='application/json')
check(upd.status_code == 200, 'Profile PUT 200')
check(upd.json().get('target_role') == 'Lead Python Architect', 'Target role updated')

print()
print('[4] Resume Upload')
pdf_path = r'c:\Users\Sajid\Documents\Major Project\AI-Skill-Gap-Platform\sample_resume.pdf'
with open(pdf_path, 'rb') as f:
    resume_file = SimpleUploadedFile('sample_resume.pdf', f.read(), content_type='application/pdf')
res = c.post('/api/resumes/', {'file': resume_file})
check(res.status_code == 201, 'Resume 201', str(res.status_code))
rdata = res.json()
skills = rdata.get('skills', [])
print(f'  Skills ({len(skills)}): {skills}')
check(len(skills) >= 5, f'>=5 skills', f'got {len(skills)}')
resume_id = rdata['id']

print()
print('[5] Job Description')
jr = c.post('/api/jobs/', json.dumps({
    'title': 'Lead Python Developer', 'company': 'FinTech Corp',
    'required_skills': 'Python, Django, PostgreSQL, Docker, AWS, Kubernetes, Redis, Celery, GraphQL'
}), content_type='application/json')
check(jr.status_code == 201, 'Job create 201', str(jr.status_code))
jdata = jr.json()
jskills = jdata.get('skills', [])
print(f'  Job skills ({len(jskills)}): {jskills}')
check(len(jskills) >= 5, '>=5 job skills', f'got {len(jskills)}')
job_id = jdata['id']

print()
print('[6] Skill Gap Analysis')
ar = c.post('/api/analysis/run/', json.dumps({
    'resume_id': resume_id, 'job_id': job_id, 'threshold': 0.70
}), content_type='application/json')
check(ar.status_code in (200, 201), 'Analysis 200/201', str(ar.status_code))
ad = ar.json()
pct = ad.get('match_percentage', 0)
matched = ad.get('matched_skills', [])
missing = ad.get('missing_skills', [])
recs = ad.get('recommendations', [])
print(f'  Match:{pct}% Matched:{len(matched)} Missing:{len(missing)} Recs:{len(recs)}')
mnames = [m.get('required_skill', '') for m in matched]
gnames = [m.get('skill_name', '') for m in missing]
print(f'  Matched: {mnames}')
print(f'  Missing: {gnames}')
check(pct > 0, f'Match%>0', f'{pct}')
check(len(matched) > 0, 'Has matched skills')
check(len(missing) > 0, 'Has missing skills')
check(len(recs) > 0, 'Has recommendations')
overlap = set(x.lower() for x in mnames) & set(x.lower() for x in gnames)
check(len(overlap) == 0, 'No overlap', str(overlap))
analysis_id = ad.get('analysis', {}).get('id') or ad.get('id')
check(analysis_id is not None, 'analysis_id present')

print()
print('[7] Roadmap Tracking')
pr = c.get('/api/analysis/progress/')
check(pr.status_code == 200, 'Progress 200')
items = pr.json()
print(f'  Progress items: {len(items)}')
check(len(items) > 0, 'Items exist')
u1 = c.patch(f'/api/analysis/progress/{items[0]["id"]}/', json.dumps({'status': 'in_progress'}), content_type='application/json')
check(u1.status_code == 200, 'Update 200')
check(u1.json().get('status') == 'in_progress', 'Status=in_progress')
if len(items) >= 2:
    u2 = c.patch(f'/api/analysis/progress/{items[1]["id"]}/', json.dumps({'status': 'completed'}), content_type='application/json')
    check(u2.json().get('status') == 'completed', 'Status=completed')
pr2 = c.get('/api/analysis/progress/').json()
fi = next((x for x in pr2 if x['id'] == items[0]['id']), None)
check(fi is not None and fi['status'] == 'in_progress', 'Status persisted')

print()
print('[8] History and Detail')
hr = c.get('/api/analysis/history/')
check(hr.status_code == 200, 'History 200')
hist = hr.json()
print(f'  History: {len(hist)} entries')
check(len(hist) >= 1, '>=1 history entry')
check('match_percentage' in hist[0], 'History has match_percentage')
dr = c.get(f'/api/analysis/{analysis_id}/')
check(dr.status_code == 200, 'Detail 200', str(dr.status_code))
d = dr.json()
print(f'  Detail match%: {d.get("match_percentage")}')
check(d.get('match_percentage') is not None, 'Detail has match%')
check(len(d.get('missing_skills', [])) > 0, 'Detail has missing_skills')
check(len(d.get('matched_skills', [])) > 0, 'Detail has matched_skills')
check('recommendations' in d, 'Detail has recommendations')

print()
print('[9] Logout and Route Guard')
lo = c.post('/api/auth/logout/')
check(lo.status_code == 200, 'Logout 200')
check(c.session.get('_auth_user_id') is None, 'Session cleared')
ua = c.get('/api/auth/profile/')
check(ua.status_code in (401, 403), 'Unauth rejected', str(ua.status_code))

print()
print('='*55)
passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
print(f'Total: {passed}/{len(results)} PASSED, {failed} FAILED')
if failed == 0:
    print('ALL END-TO-END CHECKS PASSED! 100% SUCCESS!')
else:
    for lbl, ok in results:
        if not ok:
            print(f'  FAIL: {lbl}')
print('='*55)
