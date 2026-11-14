import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import api from '../lib/api';
import { useLang } from '../context/LangContext';
import ProfileCard from '../components/ProfileCard';
import { Empty, Pagination, Spinner } from '../components/Ui';

/** Shortlist + visitors pages */
export default function ProfileList({ kind }) {
  const { tt } = useLang();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => { setData(null); api.get(`/profiles/${kind}?page=${page}&limit=12`).then(setData); }, [kind, page]);
  const isShortlist = kind === 'shortlist';
  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-bold text-maroon-800">{isShortlist ? tt('Shortlisted Profiles', 'शॉर्टलिस्ट प्रोफाइल') : tt('Who viewed my profile', 'मेरी प्रोफाइल किसने देखी')}</h1>
      <div className="mt-6">
        {!data ? <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
          : data.items.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{data.items.map((p) => <ProfileCard key={p.id} p={p} />)}</div>
              <Pagination page={page} pages={data.pages} onChange={setPage} />
            </>
          ) : <Empty icon={isShortlist ? Heart : Eye} title={isShortlist ? tt('No shortlisted profiles', 'कोई शॉर्टलिस्ट प्रोफाइल नहीं') : tt('No visitors yet', 'अभी किसी ने नहीं देखा')}
            action={<Link to="/matches" className="btn-primary btn-sm">{tt('Find matches', 'रिश्ते खोजें')}</Link>} />}
      </div>
    </div>
  );
}
