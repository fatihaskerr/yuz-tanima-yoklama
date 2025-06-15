import React from 'react';

const AdminTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: 'courses', name: 'Dersler', icon: 'fa-book' },
    { key: 'teachers', name: 'Öğretmenler', icon: 'fa-chalkboard-teacher' },
    { key: 'students', name: 'Öğrenciler', icon: 'fa-user-graduate' },
    { key: 'attendance', name: 'Yoklama Verileri', icon: 'fa-clipboard-list' },
  ];

  return (
    <div className="container section pb-0 pt-5">
      <div className="tabs is-boxed">
        <ul>
          {tabs.map((tab, index) => (
            <li key={tab.key} className={activeTab === index ? 'is-active' : ''}>
              <a onClick={() => setActiveTab(index)}>
                <span className="icon is-small"><i className={`fas ${tab.icon}`}></i></span>
                <span>{tab.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminTabs;
