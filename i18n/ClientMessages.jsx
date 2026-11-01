// Server component: kisi page ke client components ko us page ke extra
// namespaces dena (layout sirf common/nav/footer… deta hai).
//   <ClientMessages lang={lang} ns={['auth']}> <SignIn /> </ClientMessages>
import { I18nProvider } from './client';
import { getDictionary } from './server';
import { pickNamespaces } from './translate';

export default function ClientMessages({ lang, ns, alternates, children }) {
  return (
    <I18nProvider messages={pickNamespaces(getDictionary(lang), ns)} alternates={alternates}>
      {children}
    </I18nProvider>
  );
}
