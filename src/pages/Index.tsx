import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type Status = 'Бомж' | 'Богач' | 'Миллионер' | 'Миллиардер' | 'Читер' | 'VIP' | 'Хакер' | 'Бог';

interface Business {
  id: number;
  name: string;
  cost: number;
  income: number;
  emoji: string;
}

const BUSINESSES: Business[] = [
  { id: 1, name: '24/7 Бизнес', cost: 10000, income: 100, emoji: '🏪' },
  { id: 2, name: 'Стартап', cost: 50000, income: 600, emoji: '💼' },
  { id: 3, name: 'Компания', cost: 250000, income: 3500, emoji: '🏢' },
  { id: 4, name: 'Корпорация', cost: 1000000, income: 15000, emoji: '🏭' },
  { id: 5, name: 'ООО Миллиардеры', cost: 10000000, income: 200000, emoji: '🏛️' }
];

const STATUS_CONFIG: Record<Status, { min: number; clickIncome: number; color: string }> = {
  'Бомж': { min: 0, clickIncome: 100, color: '#8E9196' },
  'Богач': { min: 100000, clickIncome: 500, color: '#34C759' },
  'Миллионер': { min: 1000000, clickIncome: 2000, color: '#FFD700' },
  'Миллиардер': { min: 100000000, clickIncome: 10000, color: '#0088CC' },
  'Читер': { min: 500000000, clickIncome: 50000, color: '#FF3B30' },
  'VIP': { min: 1000000000, clickIncome: 100000, color: '#9b87f5' },
  'Хакер': { min: 5000000000, clickIncome: 500000, color: '#34C759' },
  'Бог': { min: 10000000000, clickIncome: 1000000, color: '#FFD700' }
};

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState(0);
  const [donatBalance, setDonatBalance] = useState(0);
  const [status, setStatus] = useState<Status>('Бомж');
  const [ownedBusinesses, setOwnedBusinesses] = useState<Record<number, number>>({});
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const { toast } = useToast();

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU');
  };

  const getStatus = (balance: number): Status => {
    const statuses = Object.entries(STATUS_CONFIG).reverse();
    for (const [statusName, config] of statuses) {
      if (balance >= config.min) return statusName as Status;
    }
    return 'Бомж';
  };

  useEffect(() => {
    const newStatus = getStatus(balance);
    if (newStatus !== status) {
      setStatus(newStatus);
      toast({
        title: `🎉 Новый статус: ${newStatus}!`,
        description: `Доход за клик: ${formatNumber(STATUS_CONFIG[newStatus].clickIncome)} монет`,
      });
    }
  }, [balance]);

  useEffect(() => {
    const interval = setInterval(() => {
      const totalIncome = Object.entries(ownedBusinesses).reduce((sum, [id, count]) => {
        const business = BUSINESSES.find(b => b.id === parseInt(id));
        return sum + (business ? business.income * count : 0);
      }, 0);
      setPassiveIncome(totalIncome);
      if (totalIncome > 0) {
        setBalance(prev => prev + totalIncome);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [ownedBusinesses]);

  const handleLogin = () => {
    if (login === 'plutka' && password === '123') {
      setIsLoggedIn(true);
      toast({ title: '✅ Вход выполнен успешно!' });
    } else {
      toast({ title: '❌ Неверный логин или пароль', variant: 'destructive' });
    }
  };

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClick < 1000) {
      toast({ title: '⏱️ Подождите секунду!', variant: 'destructive' });
      return;
    }
    setLastClick(now);
    setBalance(prev => prev + STATUS_CONFIG[status].clickIncome);
  };

  const buyBusiness = (business: Business) => {
    if (balance >= business.cost) {
      setBalance(prev => prev - business.cost);
      setOwnedBusinesses(prev => ({
        ...prev,
        [business.id]: (prev[business.id] || 0) + 1
      }));
      toast({ title: `✅ Куплен: ${business.name}` });
    } else {
      toast({ title: '❌ Недостаточно монет', variant: 'destructive' });
    }
  };

  const sellBusiness = (business: Business) => {
    if (ownedBusinesses[business.id] && ownedBusinesses[business.id] > 0) {
      const sellPrice = Math.floor(business.cost * 0.55);
      setBalance(prev => prev + sellPrice);
      setOwnedBusinesses(prev => ({
        ...prev,
        [business.id]: prev[business.id] - 1
      }));
      toast({ title: `💰 Продан: ${business.name}` });
    }
  };

  const playCasino = (bet: number) => {
    if (balance < bet) {
      toast({ title: '❌ Недостаточно монет', variant: 'destructive' });
      return;
    }
    const win = Math.random() > 0.6;
    if (win) {
      const winAmount = Math.floor(bet * 1.5);
      setBalance(prev => prev + winAmount);
      toast({ title: `🎰 Выигрыш! +${formatNumber(winAmount)}`, description: 'Вы выиграли!' });
    } else {
      setBalance(prev => prev - bet);
      toast({ title: `😢 Проигрыш: -${formatNumber(bet)}`, variant: 'destructive' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">💰 От Бомжа до Миллиардера</h1>
            <p className="text-muted-foreground">Войдите, чтобы начать игру</p>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full" size="lg">
              Войти
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: STATUS_CONFIG[status].color }}>
                {status}
              </h2>
              <p className="text-sm text-muted-foreground">Доход за клик: {formatNumber(STATUS_CONFIG[status].clickIncome)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
              <Icon name="LogOut" size={16} />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>💰 Баланс</span>
              <span className="font-bold text-lg">{formatNumber(balance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>💎 Донат валюта</span>
              <span className="font-bold">{formatNumber(donatBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>📈 Пассивный доход/сек</span>
              <span className="font-bold text-accent">{formatNumber(passiveIncome)}</span>
            </div>
          </div>

          <Button 
            onClick={handleClick} 
            className="w-full h-24 text-2xl font-bold"
            size="lg"
          >
            💵 ЗАРАБОТАТЬ
          </Button>
        </Card>

        <Tabs defaultValue="business" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="business">🏢 Бизнесы</TabsTrigger>
            <TabsTrigger value="casino">🎰 Казино</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-3">
            {BUSINESSES.map(business => (
              <Card key={business.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{business.emoji}</span>
                    <div>
                      <h3 className="font-semibold">{business.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        💰 {formatNumber(business.cost)} | 📊 {formatNumber(business.income)}/сек
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">×{ownedBusinesses[business.id] || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => buyBusiness(business)} 
                    className="flex-1"
                    disabled={balance < business.cost}
                  >
                    Купить
                  </Button>
                  <Button 
                    onClick={() => sellBusiness(business)}
                    variant="outline"
                    disabled={!ownedBusinesses[business.id] || ownedBusinesses[business.id] === 0}
                  >
                    Продать (55%)
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="casino" className="space-y-3">
            <Card className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">🎰 Казино</h3>
                <p className="text-sm text-muted-foreground">
                  Шанс выигрыша: 40% | Коэффициент: ×1.5
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[1000, 10000, 100000, 1000000].map(bet => (
                  <Button
                    key={bet}
                    onClick={() => playCasino(bet)}
                    variant="secondary"
                    size="lg"
                    disabled={balance < bet}
                  >
                    {formatNumber(bet)}
                  </Button>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
