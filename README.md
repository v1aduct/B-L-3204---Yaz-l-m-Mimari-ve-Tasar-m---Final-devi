# Akıllı Kampüs Duyuru ve Bildirim Yönetim Sistemi

Bu proje, **İzmir Bakırçay Üniversitesi** Yazılım Mühendisliği Bölümü **BİL 3204 - Yazılım Mimari ve Tasarımı** dersi kapsamında geliştirilmiştir.

### Akademik Bilgiler
* **Üniversite:** İzmir Bakırçay Üniversitesi
* **Ders:** BİL 3204 - Yazılım Mimari ve Tasarımı
* **Öğrenci:** Mehmet Akif Akbulut
* **Öğrenci No:** 230601004

---

## 1. Proje Genel Bakışı
**Akıllı Kampüs Duyuru ve Bildirim Yönetim Sistemi**, kampüs bünyesinde gerçekleşen sınavlar, etkinlikler gibi duyuruları merkezi bir yayıncı üzerinden yöneten ve bu duyuruları ilgili gözlemcilere (Öğrenciler ve Öğretmenler) tercih ettikleri kanallar (E-posta, SMS) üzerinden otomatik olarak ileten web tabanlı, etkileşimli bir simülasyon sistemidir.

Proje, yazılım mimarisi prensiplerine uygun olarak **4 Katmanlı Etki Alanı Odaklı Tasarım (4-Layer Domain-Driven Design - DDD)** mimarisini esas alır ve üç adet zorunlu tasarım desenini (**Observer, Factory, Singleton**) uçtan uca uygular.

---

## 2. Kullanılan Tasarım Desenleri

### A. Gözlemci Deseni (Observer Pattern)
Duyuru yayınlama sistemini gevşek bağlı (loosely-coupled) bir yapıda kurmak için tercih edilmiştir. 
* **Yayıncı (Subject - `AnnouncementPublisher`):** Kendisine kayıtlı olan gözlemcileri listeler. Yeni bir duyuru yayınlandığında tüm aboneleri dönerek güncelleme (`update`) mesajını tetikler.
* **Gözlemciler (Observers - `Student`, `Teacher`):** `IObserver` arayüzünü uygular. Yayıncıdan bildirim geldiğinde hem kendi iç veri yapılarında duyuruyu saklar hem de tercih ettikleri iletişim kanallarına yönlendirirler.

### B. Fabrika Deseni (Factory Pattern)
Nesne oluşturma mantığını merkezi hale getirmek ve kodun genişletilebilirliğini artırmak (Open-Closed Principle) amacıyla uygulanmıştır:
* **`AnnouncementFactory`:** Gelen parametrelere göre dinamik olarak `ExamAnnouncement` (Sınav Duyurusu) veya `EventAnnouncement` (Etkinlik Duyurusu) sınıflarını üretir.
* **`NotificationFactory`:** Gözlemcilerin tercihlerine göre `EmailNotification` veya `SMSNotification` nesnelerini somutlaştırır.

### C. Tekil Deseni (Singleton Pattern)
Sistem genelindeki olay günlüğü (logging) kayıtlarının tek bir noktadan yönetilmesini sağlamak amacıyla **thread-safe (iplik güvenli)** bir Tekil Logger sınıfı (`Logger`) oluşturulmuştur. 
* Çift kilitli denetleme (`double-checked locking`) ve kilitleme (`threading.Lock`) mekanizmaları kullanılarak iplikler arası yarış durumları (race conditions) engellenmiştir.

---

## 3. Mimari Katmanlar (4-Layer DDD)

Proje dizin yapısı etki alanı tasarımına uygun olarak aşağıdaki gibidir:

```text
smart_campus_app/
├── src/
│   ├── domain/           # İş Mantığı Soyutlamaları ve Varlıklar (domain-driven)
│   │   ├── interfaces.py # ISubject, IObserver, INotification arayüzleri
│   │   ├── entities.py   # Student, Teacher ve User sınıfları
│   │   └── announcements.py # ExamAnnouncement ve EventAnnouncement sınıfları
│   │
│   ├── infrastructure/   # Dış Kaynak ve Somut Gerçekleştirmeler (infrastucture)
│   │   ├── factories.py  # Nesne fabrikaları (Factory Pattern)
│   │   ├── notifications.py # E-posta ve SMS somut bildirim gönderimleri
│   │   └── repository.py # Bellek içi veri saklama depoları (InMemory Repository)
│   │
│   ├── application/      # İş Akışı Yönetimi (application orchestrator)
│   │   ├── services.py   # Yayıncı servisleri ve etki alanı koordinasyonu
│   │   └── singletons.py # Tekil log kaydedici (Singleton Logger)
│   │
│   ├── presentation/     # Sunum ve Arayüz Katmanı (presentation)
│   │   ├── routes.py     # FastAPI REST API uç noktaları (Endpoints)
│   │   ├── main.py       # FastAPI sunucu yapılandırması ve veri tohumlama (seeding)
│   │   └── static/       # Derlenmiş modern React/Vite web arayüzü dosyaları
│   │
├── frontend/             # Geliştirme aşamasındaki React-Vite kaynak kodları
├── test_patterns.py      # Tasarım desenlerini doğrulayan birim test senaryoları
├── requirements.txt      # Python kütüphane bağımlılıkları
└── README.md             # Proje kılavuzu
```

---

## 4. Teknoloji Yığını
* **Arka Uç (Backend):** Python 3.9+, FastAPI, Uvicorn, Pydantic, unittest.
* **Ön Uç (Frontend):** React (Vite tabanlı), HTML5, CSS3 (Cam Tözü - Glassmorphism stili), SVG Animations.
* **İletişim:** REST API üzerinden gerçek zamanlı kısa aralıklarla sorgulama (polling).

---

## 5. Kurulum ve Çalıştırma

### A. Gereksinimlerin Yüklenmesi
Geliştirici veya test ortamında terminali açarak aşağıdaki komut yardımıyla arka uç bağımlılıklarını yükleyin:
```cmd
python -m pip install -r requirements.txt
```

### B. Projeyi Çalıştırma (Üretim Modu - Tek Port)
Derlenen ön uç kodları FastAPI'ye gömülü durumdadır. Sunucuyu çalıştırmak için tek bir komut yeterlidir:
```cmd
python -m uvicorn src.presentation.main:app --host 127.0.0.1 --port 8000 --reload
```
Uygulama başladıktan sonra tarayıcınızdan **[http://127.0.0.1:8000](http://127.0.0.1:8000)** adresine giderek sistemi kullanabilirsiniz.

### C. Projeyi Çalıştırma (Geliştirici Modu - Çift Port)
Kodlarda anlık düzenleme yapmak ve sıcak yüklemeyi (Hot Reload) etkinleştirmek istiyorsanız:
1. **FastAPI Arka Uç Sunucusunu Başlatın:**
   ```cmd
   python -m uvicorn src.presentation.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Vite Ön Uç Geliştirme Sunucusunu Başlatın:**
   ```cmd
   cd frontend
   npm run dev
   ```
3. Tarayıcınızda terminalde gösterilen Vite adresini (genellikle **[http://localhost:5173](http://localhost:5173)**) açın. İstekler 8000 portuna otomatik vekil (proxy) yönlendirmesiyle aktarılacaktır.

---

## 6. Doğrulama ve Birim Testleri

Tasarım desenlerinin doğruluğunu test etmek için yazılmış `test_patterns.py` dosyasını şu komutla çalıştırabilirsiniz:
```cmd
python test_patterns.py
```

**Başarılı Test Çıktısı örneği:**
```text
Ran 4 tests in 0.000s
OK
[LOGGER] [2026-06-05 21:54:03] Attached observer: Ahmet (student)
[LOGGER] [2026-06-05 21:54:03] Attached observer: Mehmet (teacher)
[LOGGER] [2026-06-05 21:54:03] Publishing announcement: 'Final Exam' (exam) to 2 observers.
[EMAIL] Sending to ahmet@edu.tr: New exam announcement: Final Exam. Final details
[LOGGER] [2026-06-05 21:54:03] EMAIL sent to Ahmet (ahmet@edu.tr): New exam announcement: Final Exam. Final details
[SMS] Sending to +90555: New exam announcement: Final Exam. Final details
[LOGGER] [2026-06-05 21:54:03] SMS sent to Mehmet (+90555): New exam announcement: Final Exam. Final details
[LOGGER] [2026-06-05 21:54:03] Testing Singleton
```
