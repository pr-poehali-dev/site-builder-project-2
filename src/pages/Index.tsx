import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/9c53a91b-4338-4487-b39c-1186acecb8f6';

type Status = 'Бомж' | 'Богач' | 'Миллионер' | 'Миллиардер' | 'Читер' | 'VIP' | 'Хакер' | 'Бог';

interface Business {
  id: number;
  name: string;
  cost: number;
  income: number;
  emoji: string;
}

interface Player {
  id: number;
  username: string;
  balance: number;
  donat_balance: number;
  status: Status;
  is_admin: boolean;
}

const BUSINESSES: Business[] = [
  { id: 1, name: '24/7 Бизнес', cost: 10000, income: 100, emoji: '🏪' },
  { id: 2, name: 'Стартап', cost: 50000, income: 600, emoji: '💼' },
  { id: 3, name: 'Компания', cost: 250000, income: 3500, emoji: '🏢' },
  { id: 4, name: 'Корпорация', cost: 1000000, income: 15000, emoji: '🏭' },
  { id: 5, name: 'ООО Миллиардеры', cost: 10000000, income: 200000, emoji: '🏛️' }
];

const CARS: Business[] = [
  { id: 1, name: 'Ока', cost: 5000, income: 50, emoji: '🚗' },
  { id: 2, name: 'Лада', cost: 25000, income: 300, emoji: '🚙' },
  { id: 3, name: 'BMW', cost: 150000, income: 2000, emoji: '🚘' },
  { id: 4, name: 'Mercedes', cost: 800000, income: 10000, emoji: '🚐' },
  { id: 5, name: 'Ferrari', cost: 5000000, income: 100000, emoji: '🏎️' },
  { id: 6, name: 'Bugatti', cost: 25000000, income: 500000, emoji: '🏁' }
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
  const [currentUser, setCurrentUser] = useState('');
  const [balance, setBalance] = useState(0);
  const [donatBalance, setDonatBalance] = useState(0);
  const [status, setStatus] = useState<Status>('Бомж');
  const [isAdmin, setIsAdmin] = useState(false);
  const [ownedBusinesses, setOwnedBusinesses] = useState<Record<number, number>>({});
  const [ownedCars, setOwnedCars] = useState<Record<number, number>>({});
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [lastVisit, setLastVisit] = useState('');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [adminAmount, setAdminAmount] = useState('');
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

  const saveProgress = async () => {
    if (!currentUser) return;
    
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          balance,
          donat_balance: donatBalance,
          status,
          businesses: ownedBusinesses,
          cars: ownedCars,
          total_clicks: totalClicks
        })
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const loadProgress = async (username: string) => {
    try {
      const response = await fetch(`${API_URL}?username=${username}`);
      const data = await response.json();
      
      if (data.player) {
        setBalance(data.player.balance);
        setDonatBalance(data.player.donat_balance);
        setStatus(data.player.status);
        setIsAdmin(data.player.is_admin);
        setTotalClicks(data.player.total_clicks || 0);
        setTotalVisits(data.player.total_visits || 0);
        setLastVisit(data.player.last_visit || '');
        
        const businesses: Record<number, number> = {};
        data.businesses.forEach((b: any) => {
          businesses[b.business_type] = b.count;
        });
        setOwnedBusinesses(businesses);
        
        const cars: Record<number, number> = {};
        data.cars.forEach((c: any) => {
          cars[c.car_type] = c.count;
        });
        setOwnedCars(cars);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const loadAllPlayers = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setAllPlayers(data.players || []);
    } catch (error) {
      console.error('Load players error:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(saveProgress, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, balance, donatBalance, status, ownedBusinesses, ownedCars, totalClicks]);

  useEffect(() => {
    const newStatus = getStatus(balance);
    if (newStatus !== status) {
      setStatus(newStatus);
      toast({
        title: `🎉 Новый статус: ${newStatus}!`,
        description: `Поздравляем с повышением статуса!`,
      });
    }
  }, [balance, status]);

  useEffect(() => {
    const interval = setInterval(() => {
      const businessIncome = Object.entries(ownedBusinesses).reduce((sum, [id, count]) => {
        const business = BUSINESSES.find(b => b.id === parseInt(id));
        return sum + (business ? business.income * count : 0);
      }, 0);
      
      const carIncome = Object.entries(ownedCars).reduce((sum, [id, count]) => {
        const car = CARS.find(c => c.id === parseInt(id));
        return sum + (car ? car.income * count : 0);
      }, 0);
      
      const totalIncome = businessIncome + carIncome;
      setPassiveIncome(totalIncome);
      
      if (totalIncome > 0) {
        setBalance(prev => prev + totalIncome);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [ownedBusinesses, ownedCars]);

  const handleLogin = async () => {
    if (login === 'plutka' && password === '123') {
      const username = 'admin_' + Date.now();
      setCurrentUser(username);
      
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, is_admin: true })
        });
        
        setIsAdmin(true);
        setIsLoggedIn(true);
        await loadAllPlayers();
        toast({ title: '✅ Вход выполнен успешно!' });
      } catch (error) {
        toast({ title: '❌ Ошибка подключения', variant: 'destructive' });
      }
    } else {
      toast({ title: '❌ Неверный логин или пароль', variant: 'destructive' });
    }
  };

  const handleGuestLogin = async () => {
    const username = 'guest_' + Date.now();
    setCurrentUser(username);
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      await loadProgress(username);
      setIsLoggedIn(true);
      toast({ title: '✅ Добро пожаловать в игру!' });
    } catch (error) {
      toast({ title: '❌ Ошибка подключения', variant: 'destructive' });
    }
  };

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClick < 1000) {
      toast({ title: '⏱️ Подождите секунду!', variant: 'destructive' });
      return;
    }
    setLastClick(now);
    const randomIncome = Math.floor(Math.random() * (2000 - 356 + 1)) + 356;
    setBalance(prev => prev + randomIncome);
    setTotalClicks(prev => prev + 1);
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

  const buyCar = (car: Business) => {
    if (balance >= car.cost) {
      setBalance(prev => prev - car.cost);
      setOwnedCars(prev => ({
        ...prev,
        [car.id]: (prev[car.id] || 0) + 1
      }));
      toast({ title: `✅ Куплен: ${car.name}` });
    } else {
      toast({ title: '❌ Недостаточно монет', variant: 'destructive' });
    }
  };

  const sellCar = (car: Business) => {
    if (ownedCars[car.id] && ownedCars[car.id] > 0) {
      const sellPrice = Math.floor(car.cost * 0.55);
      setBalance(prev => prev + sellPrice);
      setOwnedCars(prev => ({
        ...prev,
        [car.id]: prev[car.id] - 1
      }));
      toast({ title: `💰 Продан: ${car.name}` });
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

  const giveCoins = async () => {
    if (!selectedPlayer || !adminAmount) return;
    
    try {
      const player = allPlayers.find(p => p.username === selectedPlayer);
      if (!player) return;
      
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedPlayer,
          balance: player.balance + parseInt(adminAmount)
        })
      });
      
      await loadAllPlayers();
      setAdminAmount('');
      toast({ title: `✅ Выдано ${formatNumber(parseInt(adminAmount))} монет` });
    } catch (error) {
      toast({ title: '❌ Ошибка', variant: 'destructive' });
    }
  };

  const changePlayerStatus = async (newStatus: Status) => {
    if (!selectedPlayer) return;
    
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedPlayer,
          status: newStatus
        })
      });
      
      await loadAllPlayers();
      toast({ title: `✅ Статус изменён на ${newStatus}` });
    } catch (error) {
      toast({ title: '❌ Ошибка', variant: 'destructive' });
    }
  };

  const makeAdmin = async () => {
    if (!selectedPlayer) return;
    
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedPlayer,
          is_admin: true
        })
      });
      
      await loadAllPlayers();
      toast({ title: `✅ Назначен администратор` });
    } catch (error) {
      toast({ title: '❌ Ошибка', variant: 'destructive' });
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
            <button 
              onClick={handleGuestLogin}
              className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full"
            >
              Если вы не администратор
            </button>
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
              <p className="text-sm text-muted-foreground">Рандомный доход: 356-2000</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setIsLoggedIn(false); saveProgress(); }}>
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
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="business">🏢 Бизнесы</TabsTrigger>
            <TabsTrigger value="cars">🚗 Авто</TabsTrigger>
            <TabsTrigger value="profile">👤 Профиль</TabsTrigger>
            <TabsTrigger value="casino">🎰 Казино</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">👑 Админ</TabsTrigger>}
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

          <TabsContent value="cars" className="space-y-3">
            {CARS.map(car => (
              <Card key={car.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{car.emoji}</span>
                    <div>
                      <h3 className="font-semibold">{car.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        💰 {formatNumber(car.cost)} | 📊 {formatNumber(car.income)}/сек
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">×{ownedCars[car.id] || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => buyCar(car)} 
                    className="flex-1"
                    disabled={balance < car.cost}
                  >
                    Купить
                  </Button>
                  <Button 
                    onClick={() => sellCar(car)}
                    variant="outline"
                    disabled={!ownedCars[car.id] || ownedCars[car.id] === 0}
                  >
                    Продать (55%)
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="space-y-3">
            <Card className="p-6 space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold">👤 Профиль</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Имя пользователя</span>
                  <span className="font-semibold">{currentUser}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">💰 Баланс</span>
                  <span className="font-bold text-accent">{formatNumber(balance)}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">📊 Текущий статус</span>
                  <span className="font-bold" style={{ color: STATUS_CONFIG[status].color }}>{status}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">🖱️ Всего кликов</span>
                  <span className="font-semibold">{formatNumber(totalClicks)}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">📅 Всего заходов</span>
                  <span className="font-semibold">{totalVisits}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">⏰ Последний заход</span>
                  <span className="font-semibold text-sm">
                    {lastVisit ? new Date(lastVisit).toLocaleString('ru-RU') : 'Только что'}
                  </span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">🏢 Бизнесов</span>
                  <span className="font-semibold">
                    {Object.values(ownedBusinesses).reduce((sum, count) => sum + count, 0)}
                  </span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">🚗 Автомобилей</span>
                  <span className="font-semibold">
                    {Object.values(ownedCars).reduce((sum, count) => sum + count, 0)}
                  </span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">📈 Пассивный доход</span>
                  <span className="font-bold text-accent">{formatNumber(passiveIncome)}/сек</span>
                </div>
              </div>
            </Card>
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

          {isAdmin && (
            <TabsContent value="admin" className="space-y-3">
              <Card className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">👑 Админ-панель</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Выбрать игрока</label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите игрока" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPlayers.map(player => (
                          <SelectItem key={player.id} value={player.username}>
                            {player.username} - {formatNumber(player.balance)} 💰
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Выдать монеты</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Сумма"
                        value={adminAmount}
                        onChange={(e) => setAdminAmount(e.target.value)}
                      />
                      <Button onClick={giveCoins} disabled={!selectedPlayer}>
                        Выдать
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Изменить статус</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(STATUS_CONFIG) as Status[]).map(st => (
                        <Button
                          key={st}
                          onClick={() => changePlayerStatus(st)}
                          variant="outline"
                          size="sm"
                          disabled={!selectedPlayer}
                        >
                          {st}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={makeAdmin} variant="destructive" className="w-full" disabled={!selectedPlayer}>
                    Назначить администратором
                  </Button>

                  <Button onClick={loadAllPlayers} variant="outline" className="w-full">
                    <Icon name="RefreshCw" size={16} className="mr-2" />
                    Обновить список
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">📊 Топ игроков</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allPlayers.slice(0, 10).map((player, idx) => (
                      <div key={player.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>#{idx + 1} {player.username}</span>
                        <span className="font-bold">{formatNumber(player.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}